'use server'

import { jsPDF } from 'jspdf'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  PageBreak,
} from 'docx'
import { parse } from 'node-html-parser'
import prompts from './prompts.json'

export type OutputType = 'shortSummary' | 'mediumSummary' | 'howToGuide'

export type FileAttachment = {
  name: string
  contentType: string
  data: string
}

export type StructuredElement = {
  type: string
  content: string
  attributes?: Record<string, string>
  children?: StructuredElement[]
}

// Function to process output with retry logic
export async function processOutput(
  fileAttachments: FileAttachment[],
  outputType: OutputType,
  isRegeneration = false
) {
  // Validate input
  if (!fileAttachments || fileAttachments.length === 0) {
    throw new Error('No file attachments provided')
  }

  // Create file parts for each attachment with error handling
  const fileParts = []

  for (let i = 0; i < fileAttachments.length; i++) {
    const file = fileAttachments[i]
    try {
      // Validate file data
      if (!file.data || !file.contentType) {
        console.warn(`Skipping invalid file: ${file.name}`)
        continue
      }

      fileParts.push({
        type: 'file' as const,
        data: file.data,
        mimeType: file.contentType,
      })
    } catch (fileError) {
      console.error(`Error processing file ${file.name}:`, fileError)
      // Continue with other files instead of failing completely
    }
  }

  if (fileParts.length === 0) {
    throw new Error('No valid files could be processed')
  }

  // Maximum number of retry attempts
  const MAX_RETRIES = 3
  let retryCount = 0
  let lastError = null

  // Retry loop
  while (retryCount < MAX_RETRIES) {
    try {
      // Slightly increase temperature with each retry to get different results
      const temperatureAdjustment = retryCount * 0.1
      const baseTemperature = isRegeneration ? 0.7 : 0.3
      const adjustedTemperature = Math.min(
        baseTemperature + temperatureAdjustment,
        0.9
      )

      // Create messages array for the specified output type
      const messages = [
        {
          role: 'system' as const,
          content:
            prompts[outputType].system +
            (isRegeneration
              ? ' Please make this regeneration noticeably different from previous versions.'
              : '') +
            (retryCount > 0
              ? ` This is attempt ${
                  retryCount + 1
                } after previous failures. Please ensure your response strictly follows the required format.`
              : '') +
            (fileParts.length > 1
              ? ` You are processing ${fileParts.length} files. Please synthesize information from all files.`
              : ''),
        },
        {
          role: 'user' as const,
          content: [
            {
              type: 'text' as const,
              text:
                prompts[outputType].prompt +
                (isRegeneration
                  ? ' Please make this regeneration noticeably different from previous versions.'
                  : '') +
                (retryCount > 0
                  ? ' Please ensure your response follows the required format exactly.'
                  : '') +
                (fileParts.length > 1
                  ? ` Please analyze and synthesize information from all ${fileParts.length} uploaded files.`
                  : ''),
            },
            ...fileParts,
          ],
        },
      ]

      // Validate that we got some content
    } catch (error) {
      console.error(
        `Error generating content (attempt ${retryCount + 1}/${MAX_RETRIES}):`,
        error
      )
      lastError = error
      retryCount++

      // If we've reached max retries, throw the last error
      if (retryCount >= MAX_RETRIES) {
        throw new Error(
          `Failed to generate ${outputType} after ${MAX_RETRIES} attempts: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      }

      // Wait a short time before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
    }
  }

  // This should never be reached due to the throw in the loop, but TypeScript needs it
  throw new Error(
    `Failed to generate ${outputType}: ${
      lastError instanceof Error ? lastError.message : 'Unknown error'
    }`
  )
}

// Parse HTML content and apply styling to PDF based on HTML tags
export async function generatePDF(content: string, title: string) {
  const doc = new jsPDF()

  // Set up document margins and dimensions
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const textWidth = pageWidth - margin * 2
  let yPosition = margin

  // Add title to the PDF
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(title, margin, yPosition)
  yPosition += 15

  try {
    // Create a temporary DOM element to parse the HTML
    const parser = new DOMParser()
    const htmlDoc = parser.parseFromString(content, 'text/html')
    const elements = htmlDoc.body.childNodes

    // Track if we've seen the first h1 to avoid duplicating the title
    let firstH1Processed = false

    // Process each element and apply appropriate styling
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLElement

      // Skip text nodes and non-element nodes
      if (element.nodeType !== Node.ELEMENT_NODE) continue

      // Get the text content
      const text = element.textContent || ''
      if (!text.trim()) continue

      // Apply styling based on tag type
      switch (element.tagName.toLowerCase()) {
        case 'h1':
          // Skip the first h1 if it's similar to the title to avoid duplication
          if (!firstH1Processed) {
            firstH1Processed = true
            // If the h1 content is very similar to the title, skip it
            if (
              text.toLowerCase().includes(title.toLowerCase()) ||
              title.toLowerCase().includes(text.toLowerCase())
            ) {
              continue
            }
          }

          // Check if we need a page break
          if (yPosition > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage()
            yPosition = margin
          }

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(18)
          const h1Lines = doc.splitTextToSize(text, textWidth)
          doc.text(h1Lines, margin, yPosition)
          yPosition += 7 * h1Lines.length + 5
          break

        case 'h2':
          // Check if we need a page break
          if (yPosition > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage()
            yPosition = margin
          }

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(16)
          const h2Lines = doc.splitTextToSize(text, textWidth)
          doc.text(h2Lines, margin, yPosition)
          yPosition += 6 * h2Lines.length + 4
          break

        case 'p':
          // Check if we need a page break
          if (yPosition > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage()
            yPosition = margin
          }

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(12)
          const pLines = doc.splitTextToSize(text, textWidth)
          doc.text(pLines, margin, yPosition)
          yPosition += 5 * pLines.length + 5
          break

        case 'ol':
        case 'ul':
          // Process list items
          const listItems = element.getElementsByTagName('li')
          for (let j = 0; j < listItems.length; j++) {
            // Check if we need a page break
            if (yPosition > doc.internal.pageSize.getHeight() - 40) {
              doc.addPage()
              yPosition = margin
            }

            const itemText = listItems[j].textContent || ''
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(12)

            // Format based on list type
            const prefix =
              element.tagName.toLowerCase() === 'ol' ? `${j + 1}. ` : '• '
            const formattedText = prefix + itemText

            // Removed left margin for list items - now aligned with the main margin
            const liLines = doc.splitTextToSize(formattedText, textWidth)
            doc.text(liLines, margin, yPosition)
            yPosition += 5 * liLines.length + 3
          }
          yPosition += 2 // Add extra space after list
          break

        case 'li':
          // Individual list items are handled within ol/ul processing
          break

        default:
          // Handle other elements as paragraphs
          if (yPosition > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage()
            yPosition = margin
          }

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(12)
          const defaultLines = doc.splitTextToSize(text, textWidth)
          doc.text(defaultLines, margin, yPosition)
          yPosition += 5 * defaultLines.length + 3
      }
    }
  } catch (error) {
    console.error('Error generating PDF:', error)
    // Fallback to simple text
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Error processing content. Please try again.', margin, 40)
  }

  // Return base64 encoded PDF
  return doc.output('datauristring')
}

export async function generateDOCX(content: string, title: string) {
  try {
    // Handle multiple HTML documents by splitting on <html> tags
    const htmlSections = content
      .split(/<html[^>]*>/i)
      .filter((section) => section.trim())

    // Create document with sections
    const docChildren = []

    // Add title
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 36,
          }),
        ],
        spacing: {
          after: 400,
        },
      })
    )

    let skipNextPageBreak = false

    // Process each HTML section
    for (
      let sectionIndex = 0;
      sectionIndex < htmlSections.length;
      sectionIndex++
    ) {
      let sectionContent = htmlSections[sectionIndex]

      // Clean up the section content - remove closing </html> tags
      sectionContent = sectionContent.replace(/<\/html>/gi, '')

      // If this isn't the first section, add a page break
      if (sectionIndex > 0) {
        docChildren.push(new Paragraph({ children: [new PageBreak()] }))
        skipNextPageBreak = true
      }

      // Parse the section content
      const htmlDoc = parse(sectionContent)

      // Process each element in the HTML body or root
      const bodyElement = htmlDoc.querySelector('body')
      const elements = bodyElement ? bodyElement.childNodes : htmlDoc.childNodes

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as any

        // Handle page break divs
        if (
          element.nodeType === 1 && // Element node
          element.tagName?.toLowerCase() === 'div' &&
          element.getAttribute('style')?.includes('page-break-before: always')
        ) {
          docChildren.push(new Paragraph({ children: [new PageBreak()] }))
          skipNextPageBreak = true
          continue
        }

        // Skip text nodes and non-element nodes
        if (element.nodeType !== 1) continue

        // Get the text content
        const text = element.text || ''
        if (!text.trim()) continue

        // Apply styling based on tag type
        switch (element.tagName.toLowerCase()) {
          case 'h1':
            // Add a page break before new major sections (unless we just added one)
            if (!skipNextPageBreak) {
              docChildren.push(new Paragraph({ children: [new PageBreak()] }))
            }
            skipNextPageBreak = false

            docChildren.push(
              new Paragraph({
                heading: HeadingLevel.HEADING_1,
                children: [
                  new TextRun({
                    text: text,
                    bold: true,
                    size: 32,
                  }),
                ],
                spacing: {
                  after: 300,
                  before: 300,
                },
              })
            )
            break

          case 'h2':
            docChildren.push(
              new Paragraph({
                heading: HeadingLevel.HEADING_2,
                children: [
                  new TextRun({
                    text: text,
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: {
                  after: 200,
                  before: 200,
                },
              })
            )
            break

          case 'p':
            docChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: text,
                    size: 24,
                  }),
                ],
                spacing: {
                  after: 120,
                },
              })
            )
            break

          case 'ol':
          case 'ul':
            // Process list items
            const listItems = element.querySelectorAll('li')
            for (let j = 0; j < listItems.length; j++) {
              const itemText = listItems[j].text || ''

              // Format based on list type
              const prefix =
                element.tagName.toLowerCase() === 'ol' ? `${j + 1}. ` : '• '

              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: prefix + itemText,
                      size: 24,
                    }),
                  ],
                  spacing: {
                    after: 100,
                  },
                  indent: {
                    left: 720, // 0.5 inches in twips (1440 twips = 1 inch)
                  },
                })
              )
            }
            // Add extra space after list
            docChildren.push(
              new Paragraph({
                children: [new TextRun({ text: '' })],
                spacing: { after: 120 },
              })
            )
            break

          case 'li':
            // Individual list items are handled within ol/ul processing
            break

          default:
            // Handle other elements as paragraphs
            docChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: text,
                    size: 24,
                  }),
                ],
                spacing: {
                  after: 120,
                },
              })
            )
        }
      }
    }

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch in twips
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: docChildren,
        },
      ],
    })

    // Generate buffer
    const buffer = await Packer.toBuffer(doc)

    // Convert buffer to base64
    const base64 = Buffer.from(buffer).toString('base64')

    // Return as data URI
    return `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`
  } catch (error) {
    console.error('Error generating DOCX:', error)

    // Create a simple error document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              heading: HeadingLevel.TITLE,
              children: [
                new TextRun({
                  text: title,
                  bold: true,
                  size: 36,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Error processing content. Please try again.',
                  size: 24,
                }),
              ],
            }),
          ],
        },
      ],
    })

    // Generate buffer
    const buffer = await Packer.toBuffer(doc)

    // Convert buffer to base64
    const base64 = Buffer.from(buffer).toString('base64')

    // Return as data URI
    return `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`
  }
}
