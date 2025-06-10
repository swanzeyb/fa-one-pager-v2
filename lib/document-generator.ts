/**
 * Unified Document Generation System
 *
 * This module provides consistent HTML-to-document conversion for both PDF and DOCX formats.
 * It ensures identical formatting, styling, and layout across different output types.
 */

import { jsPDF } from 'jspdf'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  PageBreak,
  ImageRun,
} from 'docx'

// Document configuration constants for consistency
export const DOCUMENT_CONFIG = {
  margins: {
    pdf: 20, // points
    docx: 1440, // twips (1 inch)
  },
  fontSizes: {
    // PDF sizes in points, DOCX sizes in half-points (2x)
    title: { pdf: 20, docx: 36 },
    h1: { pdf: 18, docx: 32 },
    h2: { pdf: 16, docx: 28 },
    h3: { pdf: 14, docx: 26 },
    body: { pdf: 12, docx: 24 },
    small: { pdf: 10, docx: 20 },
  },
  spacing: {
    // PDF line heights, DOCX spacing in twips
    title: { pdf: 15, docx: 400 },
    h1: { pdf: 12, docx: 300 },
    h2: { pdf: 10, docx: 200 },
    h3: { pdf: 8, docx: 160 },
    paragraph: { pdf: 6, docx: 120 },
    listItem: { pdf: 5, docx: 100 },
  },
  indentation: {
    listItem: { pdf: 10, docx: 720 }, // 0.5 inches in respective units
  },
} as const

// Structured element interface for consistent parsing
export interface DocumentElement {
  type:
    | 'title'
    | 'heading'
    | 'paragraph'
    | 'list'
    | 'listItem'
    | 'pageBreak'
    | 'image'
    | 'text'
  content: string
  level?: number // For headings (1-6)
  listType?: 'ordered' | 'unordered'
  attributes?: Record<string, string>
  children?: DocumentElement[]
  metadata?: {
    isFirstH1?: boolean
    shouldSkip?: boolean
    imageData?: string
    imageType?: string
    index?: number
  }
}

/**
 * Preprocesses and normalizes HTML content before conversion
 */
export function preprocessHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  // Remove script and style tags for security
  let processed = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  )
  processed = processed.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    ''
  )

  // Normalize whitespace
  processed = processed.replace(/\s+/g, ' ').trim()

  // Ensure proper HTML structure
  if (!processed.includes('<')) {
    // Plain text - wrap in paragraph
    return `<p>${processed}</p>`
  }

  // Fix unclosed tags (basic cleanup)
  processed = processed.replace(/<br\s*\/?>/gi, '<br>')
  processed = processed.replace(/<hr\s*\/?>/gi, '<hr>')

  // Normalize page break markers
  processed = processed.replace(
    /<div[^>]*style[^>]*page-break-before:\s*always[^>]*>.*?<\/div>/gi,
    '<pagebreak>'
  )

  return processed
}

/**
 * Validates HTML content and handles edge cases
 */
export function validateHtmlContent(html: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!html || html.trim().length === 0) {
    errors.push('Content is empty')
    return { isValid: false, errors }
  }

  // Check for basic malformed HTML patterns
  const openTags = html.match(/<[^/][^>]*>/g) || []
  const closeTags = html.match(/<\/[^>]*>/g) || []

  // Basic tag balance check (simplified)
  const tagCounts: Record<string, number> = {}

  openTags.forEach((tag) => {
    const tagName = tag.match(/<(\w+)/)?.[1]?.toLowerCase()
    if (
      tagName &&
      !['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tagName)
    ) {
      tagCounts[tagName] = (tagCounts[tagName] || 0) + 1
    }
  })

  closeTags.forEach((tag) => {
    const tagName = tag.match(/<\/(\w+)/)?.[1]?.toLowerCase()
    if (tagName) {
      tagCounts[tagName] = (tagCounts[tagName] || 0) - 1
    }
  })

  // Check for severely unbalanced tags
  const unbalancedTags = Object.entries(tagCounts).filter(
    ([_, count]) => Math.abs(count) > 2
  )
  if (unbalancedTags.length > 0) {
    errors.push(
      `Potentially unbalanced HTML tags: ${unbalancedTags
        .map(([tag]) => tag)
        .join(', ')}`
    )
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Parses HTML into a structured document format
 */
export function parseHtmlToDocumentStructure(
  html: string,
  title: string
): DocumentElement[] {
  const processed = preprocessHtml(html)
  const validation = validateHtmlContent(processed)

  if (!validation.isValid) {
    console.warn('HTML validation warnings:', validation.errors)
  }

  const elements: DocumentElement[] = []

  try {
    // Parse HTML using DOMParser
    const parser = new DOMParser()
    const doc = parser.parseFromString(processed, 'text/html')

    // Add title as first element
    if (title?.trim()) {
      elements.push({
        type: 'title',
        content: title.trim(),
      })
    }

    // Track if we've seen the first H1 to avoid duplication
    let firstH1Processed = false

    // Process body elements
    const processNode = (node: Node): DocumentElement[] => {
      const nodeElements: DocumentElement[] = []

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim()
        if (text) {
          nodeElements.push({
            type: 'text',
            content: text,
          })
        }
        return nodeElements
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        const tagName = element.tagName.toLowerCase()
        const textContent = element.textContent?.trim() || ''

        switch (tagName) {
          case 'pagebreak':
            nodeElements.push({ type: 'pageBreak', content: '' })
            break

          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            if (tagName === 'h1' && !firstH1Processed) {
              firstH1Processed = true
              // Skip if similar to title to avoid duplication
              if (
                title &&
                (textContent.toLowerCase().includes(title.toLowerCase()) ||
                  title.toLowerCase().includes(textContent.toLowerCase()))
              ) {
                break
              }
            }

            if (textContent) {
              nodeElements.push({
                type: 'heading',
                content: textContent,
                level: parseInt(tagName.charAt(1)),
              })
            }
            break

          case 'p':
            if (textContent) {
              nodeElements.push({
                type: 'paragraph',
                content: textContent,
              })
            }
            break

          case 'ol':
          case 'ul':
            const listItems = Array.from(element.getElementsByTagName('li'))
            if (listItems.length > 0) {
              const listElement: DocumentElement = {
                type: 'list',
                content: '',
                listType: tagName === 'ol' ? 'ordered' : 'unordered',
                children: [],
              }

              listItems.forEach((li, index) => {
                const itemText = li.textContent?.trim()
                if (itemText) {
                  listElement.children!.push({
                    type: 'listItem',
                    content: itemText,
                    listType: listElement.listType,
                    metadata: { index },
                  })
                }
              })

              if (listElement.children!.length > 0) {
                nodeElements.push(listElement)
              }
            }
            break

          case 'li':
            // List items are handled within ol/ul processing
            break

          case 'br':
            // Convert to line break in text
            break

          case 'img':
            const src = element.getAttribute('src')
            const alt = element.getAttribute('alt') || 'Image'
            if (src) {
              nodeElements.push({
                type: 'image',
                content: alt,
                attributes: {
                  src,
                  alt,
                },
              })
            }
            break

          default:
            // For other elements, recursively process their children
            // This ensures we don't lose nested structure
            if (element.childNodes && element.childNodes.length > 0) {
              Array.from(element.childNodes).forEach((childNode) => {
                nodeElements.push(...processNode(childNode))
              })
            } else if (textContent) {
              // Only create a paragraph if there are no children and we have text
              nodeElements.push({
                type: 'paragraph',
                content: textContent,
              })
            }
        }
      }

      return nodeElements
    }

    // Process all child nodes
    Array.from(doc.body.childNodes).forEach((node) => {
      elements.push(...processNode(node))
    })
  } catch (error) {
    console.error('Error parsing HTML:', error)
    // Fallback: create a simple paragraph with the content
    elements.push({
      type: 'paragraph',
      content: 'Error parsing content. Please check the HTML format.',
    })
  }

  return elements.filter(
    (el) => el.content.trim() !== '' || el.type === 'pageBreak'
  )
}

/**
 * Converts structured elements to PDF
 */
export function generatePDFFromStructure(elements: DocumentElement[]): string {
  const doc = new jsPDF()
  const { margins, fontSizes, spacing } = DOCUMENT_CONFIG

  const pageWidth = doc.internal.pageSize.getWidth()
  const textWidth = pageWidth - margins.pdf * 2
  let yPosition = margins.pdf

  const checkPageBreak = (requiredHeight: number): void => {
    if (
      yPosition + requiredHeight >
      doc.internal.pageSize.getHeight() - margins.pdf
    ) {
      doc.addPage()
      yPosition = margins.pdf
    }
  }

  try {
    elements.forEach((element) => {
      switch (element.type) {
        case 'title':
          checkPageBreak(20)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(fontSizes.title.pdf)
          const titleLines = doc.splitTextToSize(element.content, textWidth)
          doc.text(titleLines, margins.pdf, yPosition)
          yPosition += spacing.title.pdf
          break

        case 'heading':
          const level = element.level || 1
          let fontSize: number
          let fontSpacing: number

          if (level === 1) {
            fontSize = fontSizes.h1.pdf
            fontSpacing = spacing.h1.pdf
          } else if (level === 2) {
            fontSize = fontSizes.h2.pdf
            fontSpacing = spacing.h2.pdf
          } else {
            fontSize = fontSizes.h3.pdf
            fontSpacing = spacing.h3.pdf
          }

          checkPageBreak(fontSpacing)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(fontSize)
          const headingLines = doc.splitTextToSize(element.content, textWidth)
          doc.text(headingLines, margins.pdf, yPosition)
          yPosition += fontSpacing
          break

        case 'paragraph':
          checkPageBreak(15)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(fontSizes.body.pdf)
          const paragraphLines = doc.splitTextToSize(element.content, textWidth)
          doc.text(paragraphLines, margins.pdf, yPosition)
          yPosition += spacing.paragraph.pdf * paragraphLines.length + 3
          break

        case 'list':
          if (element.children) {
            element.children.forEach((item, index) => {
              checkPageBreak(10)
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(fontSizes.body.pdf)

              const prefix =
                element.listType === 'ordered' ? `${index + 1}. ` : '• '
              const itemText = prefix + item.content
              const itemLines = doc.splitTextToSize(itemText, textWidth)
              doc.text(itemLines, margins.pdf, yPosition)
              yPosition += spacing.listItem.pdf * itemLines.length + 2
            })
            yPosition += 3 // Extra space after list
          }
          break

        case 'pageBreak':
          doc.addPage()
          yPosition = margins.pdf
          break

        case 'image':
          // For now, add image placeholder text
          checkPageBreak(15)
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(fontSizes.small.pdf)
          doc.text(`[Image: ${element.content}]`, margins.pdf, yPosition)
          yPosition += 15
          break

        default:
          // Handle unknown elements as paragraphs
          if (element.content) {
            checkPageBreak(15)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(fontSizes.body.pdf)
            const defaultLines = doc.splitTextToSize(element.content, textWidth)
            doc.text(defaultLines, margins.pdf, yPosition)
            yPosition += spacing.paragraph.pdf * defaultLines.length + 3
          }
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    // Add error message to document
    doc.addPage()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(fontSizes.body.pdf)
    doc.text(
      'Error generating document. Please try again.',
      margins.pdf,
      margins.pdf
    )
  }

  return doc.output('datauristring')
}

/**
 * Converts structured elements to DOCX
 */
export async function generateDOCXFromStructure(
  elements: DocumentElement[]
): Promise<string> {
  const { margins, fontSizes, spacing } = DOCUMENT_CONFIG
  const docChildren: Paragraph[] = []

  try {
    elements.forEach((element) => {
      switch (element.type) {
        case 'title':
          docChildren.push(
            new Paragraph({
              heading: HeadingLevel.TITLE,
              children: [
                new TextRun({
                  text: element.content,
                  bold: true,
                  size: fontSizes.title.docx,
                }),
              ],
              spacing: {
                after: spacing.title.docx,
              },
            })
          )
          break

        case 'heading':
          const level = element.level || 1
          let headingLevel: (typeof HeadingLevel)[keyof typeof HeadingLevel]
          let fontSize: number
          let fontSpacing: number

          if (level === 1) {
            headingLevel = HeadingLevel.HEADING_1
            fontSize = fontSizes.h1.docx
            fontSpacing = spacing.h1.docx
          } else if (level === 2) {
            headingLevel = HeadingLevel.HEADING_2
            fontSize = fontSizes.h2.docx
            fontSpacing = spacing.h2.docx
          } else {
            headingLevel = HeadingLevel.HEADING_3
            fontSize = fontSizes.h3.docx
            fontSpacing = spacing.h3.docx
          }

          docChildren.push(
            new Paragraph({
              heading: headingLevel,
              children: [
                new TextRun({
                  text: element.content,
                  bold: true,
                  size: fontSize,
                }),
              ],
              spacing: {
                after: fontSpacing,
                before: fontSpacing,
              },
            })
          )
          break

        case 'paragraph':
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: element.content,
                  size: fontSizes.body.docx,
                }),
              ],
              spacing: {
                after: spacing.paragraph.docx,
              },
            })
          )
          break

        case 'list':
          if (element.children) {
            element.children.forEach((item, index) => {
              const prefix =
                element.listType === 'ordered' ? `${index + 1}. ` : '• '

              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: prefix + item.content,
                      size: fontSizes.body.docx,
                    }),
                  ],
                  spacing: {
                    after: spacing.listItem.docx,
                  },
                  indent: {
                    left: DOCUMENT_CONFIG.indentation.listItem.docx,
                  },
                })
              )
            })

            // Add extra space after list
            docChildren.push(
              new Paragraph({
                children: [new TextRun({ text: '' })],
                spacing: { after: spacing.paragraph.docx },
              })
            )
          }
          break

        case 'pageBreak':
          docChildren.push(
            new Paragraph({
              children: [new PageBreak()],
            })
          )
          break

        case 'image':
          // For now, add image placeholder text
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `[Image: ${element.content}]`,
                  size: fontSizes.small.docx,
                  italics: true,
                }),
              ],
              spacing: {
                after: spacing.paragraph.docx,
              },
            })
          )
          break

        default:
          // Handle unknown elements as paragraphs
          if (element.content) {
            docChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: element.content,
                    size: fontSizes.body.docx,
                  }),
                ],
                spacing: {
                  after: spacing.paragraph.docx,
                },
              })
            )
          }
      }
    })

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: margins.docx,
                right: margins.docx,
                bottom: margins.docx,
                left: margins.docx,
              },
            },
          },
          children: docChildren,
        },
      ],
    })

    // Generate buffer
    const buffer = await Packer.toBuffer(doc)
    const base64 = buffer.toString('base64')

    return `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`
  } catch (error) {
    console.error('Error generating DOCX:', error)

    // Create error document
    const errorDoc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              heading: HeadingLevel.TITLE,
              children: [
                new TextRun({
                  text: 'Document Generation Error',
                  bold: true,
                  size: fontSizes.title.docx,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Error generating document. Please try again.',
                  size: fontSizes.body.docx,
                }),
              ],
            }),
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(errorDoc)
    const base64 = buffer.toString('base64')

    return `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`
  }
}

/**
 * Main unified document generation function
 */
export async function generateUnifiedDocument(
  content: string,
  title: string,
  format: 'pdf' | 'docx'
): Promise<string> {
  // Parse HTML into structured format
  const elements = parseHtmlToDocumentStructure(content, title)

  // Generate document based on format
  if (format === 'pdf') {
    return generatePDFFromStructure(elements)
  } else {
    return await generateDOCXFromStructure(elements)
  }
}
