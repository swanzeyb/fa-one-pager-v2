// Client-side actions for Firebase AI Logic
// These replace the server actions for AI processing
'use client'

import { processOutput as firebaseProcessOutput } from '@/services/firebase-ai-service'
import type { FileAttachment, OutputType, StructuredElement } from './actions'
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

// Main AI processing function - now client-side
export async function processOutput(
  fileAttachments: FileAttachment[],
  outputType: OutputType,
  isRegeneration = false
): Promise<string> {
  try {
    return await firebaseProcessOutput(
      fileAttachments,
      outputType,
      isRegeneration
    )
  } catch (error) {
    console.error('Client-side AI processing error:', error)
    throw new Error(
      `AI processing failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

// Helper function to parse HTML content (moved from server actions)
function parseHtmlToStructured(html: string): StructuredElement[] {
  const root = parse(html)

  function convertNode(node: any): StructuredElement {
    const element: StructuredElement = {
      type: node.tagName || 'text',
      content: node.text || '',
    }

    if (node.attributes) {
      element.attributes = node.attributes
    }

    if (node.childNodes && node.childNodes.length > 0) {
      element.children = node.childNodes
        .filter(
          (child: any) => child.tagName || (child.text && child.text.trim())
        )
        .map(convertNode)
    }

    return element
  }

  return root.childNodes
    .filter((node: any) => node.tagName || (node.text && node.text.trim()))
    .map(convertNode)
}

// Generate DOCX document - now client-side
export async function generateDOCX(
  content: string,
  title: string
): Promise<string> {
  try {
    const structuredContent = parseHtmlToStructured(content)

    function createDocxElements(elements: StructuredElement[]): any[] {
      const docxElements: any[] = []

      elements.forEach((element) => {
        switch (element.type) {
          case 'h1':
            docxElements.push(
              new Paragraph({
                children: [
                  new TextRun({ text: element.content, bold: true, size: 32 }),
                ],
                heading: HeadingLevel.HEADING_1,
              })
            )
            break

          case 'h2':
            docxElements.push(
              new Paragraph({
                children: [
                  new TextRun({ text: element.content, bold: true, size: 28 }),
                ],
                heading: HeadingLevel.HEADING_2,
              })
            )
            break

          case 'h3':
            docxElements.push(
              new Paragraph({
                children: [
                  new TextRun({ text: element.content, bold: true, size: 24 }),
                ],
                heading: HeadingLevel.HEADING_3,
              })
            )
            break

          case 'p':
            const textRuns: TextRun[] = []
            if (element.children && element.children.length > 0) {
              element.children.forEach((child) => {
                if (child.type === 'strong' || child.type === 'b') {
                  textRuns.push(
                    new TextRun({ text: child.content, bold: true })
                  )
                } else if (child.type === 'em' || child.type === 'i') {
                  textRuns.push(
                    new TextRun({ text: child.content, italics: true })
                  )
                } else {
                  textRuns.push(new TextRun({ text: child.content }))
                }
              })
            } else {
              textRuns.push(new TextRun({ text: element.content }))
            }
            docxElements.push(new Paragraph({ children: textRuns }))
            break

          case 'ul':
          case 'ol':
            if (element.children) {
              element.children.forEach((listItem, index) => {
                if (listItem.type === 'li') {
                  docxElements.push(
                    new Paragraph({
                      children: [
                        new TextRun({ text: `• ${listItem.content}` }),
                      ],
                    })
                  )
                }
              })
            }
            break

          case 'li':
            docxElements.push(
              new Paragraph({
                children: [new TextRun({ text: `• ${element.content}` })],
              })
            )
            break

          default:
            if (element.content && element.content.trim()) {
              docxElements.push(
                new Paragraph({
                  children: [new TextRun({ text: element.content })],
                })
              )
            }
            break
        }

        if (element.children) {
          docxElements.push(...createDocxElements(element.children))
        }
      })

      return docxElements
    }

    const docxElements = createDocxElements(structuredContent)

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: title, bold: true, size: 36 })],
              heading: HeadingLevel.TITLE,
            }),
            new PageBreak(),
            ...docxElements,
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    const url = URL.createObjectURL(blob)
    return url
  } catch (error) {
    console.error('DOCX generation error:', error)
    throw new Error(
      `Failed to generate DOCX: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

// Generate PDF document - now client-side
export async function generatePDF(
  content: string,
  title: string
): Promise<string> {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - 2 * margin

    let yPosition = margin

    // Title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(title, maxWidth)
    doc.text(titleLines, margin, yPosition)
    yPosition += titleLines.length * 10 + 10

    // Content
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')

    // Parse HTML and convert to plain text
    const root = parse(content)
    const textContent = root.text

    const lines = doc.splitTextToSize(textContent, maxWidth)

    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(line, margin, yPosition)
      yPosition += 7
    })

    const pdfBlob = doc.output('blob')
    const url = URL.createObjectURL(pdfBlob)
    return url
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error(
      `Failed to generate PDF: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

// Helper function to download files
export function downloadFile(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL after download
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
