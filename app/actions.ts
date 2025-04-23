"use server"

import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { jsPDF } from "jspdf"
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx"
import prompts from "./prompts.json"
import { z } from "zod"
import { JSDOM } from "jsdom"

export type OutputType = "shortSummary" | "mediumSummary" | "howToGuide"

export type FileAttachment = {
  name: string
  contentType: string
  data: string
}

const gemini = google("gemini-2.0-flash", {
  temperature: 0.3,
})

// Define Zod schemas for each output type
const shortSummarySchema = z.object({
  title: z.string().describe("An engaging LinkedIn-style title that highlights the paper's main author"),
  paragraphs: z
    .array(z.string().describe("A paragraph of no more than 60 words in a tech-blog tone"))
    .length(2)
    .describe("Two paragraphs of no more than 60 words each"),
})

const mediumSummarySchema = z.object({
  title: z.string().describe("An engaging blog-style title that highlights the paper's main author"),
  paragraphs: z
    .array(z.string().describe("A paragraph of no more than 60 words in a slightly instructional tone"))
    .min(3)
    .max(4)
    .describe("3-4 paragraphs of no more than 60 words each"),
})

const howToGuideSchema = z.object({
  introduction: z
    .string()
    .describe(
      "A single-paragraph introduction (≤60 words) stating the problem, what Washington State University did, and how the guide helps",
    ),
  steps: z
    .array(z.string().describe("A step with no more than three sentences"))
    .min(3)
    .max(10)
    .describe("3-10 numbered steps, each no more than three sentences"),
  images: z
    .array(
      z.object({
        description: z.string().describe("A description of what the image should show"),
        caption: z.string().describe("A brief caption for the image"),
      }),
    )
    .min(1)
    .max(2)
    .describe("1-2 simple images with brief captions"),
  authors: z.array(z.string()).describe("List of all authors with citations"),
})

// Define the schema map
const schemaMap = {
  shortSummary: shortSummarySchema,
  mediumSummary: mediumSummarySchema,
  howToGuide: howToGuideSchema,
}

// Define the output types
export type ShortSummaryOutput = z.infer<typeof shortSummarySchema>
export type MediumSummaryOutput = z.infer<typeof mediumSummarySchema>
export type HowToGuideOutput = z.infer<typeof howToGuideSchema>

// Convert structured output to markdown
function convertToMarkdown(outputType: OutputType, data: any): string {
  try {
    switch (outputType) {
      case "shortSummary": {
        const output = data as ShortSummaryOutput
        return `# ${output.title}\n\n${output.paragraphs.join("\n\n")}`
      }
      case "mediumSummary": {
        const output = data as MediumSummaryOutput
        return `# ${output.title}\n\n${output.paragraphs.join("\n\n")}`
      }
      case "howToGuide": {
        const output = data as HowToGuideOutput
        const steps = output.steps.map((step, index) => `${index + 1}. ${step}`).join("\n\n")
        const images = output.images
          .map(
            (image) =>
              `![${image.caption}](/placeholder.svg?height=300&width=500&query=${encodeURIComponent(
                image.description,
              )})\n\n*${image.caption}*`,
          )
          .join("\n\n")
        const authors = `## Authors\n\n${output.authors.join("\n\n")}`

        return `# How-to Guide\n\n${output.introduction}\n\n## Steps\n\n${steps}\n\n## Illustrations\n\n${images}\n\n${authors}`
      }
      default:
        return "Error: Unknown output type"
    }
  } catch (error) {
    console.error("Error converting to markdown:", error)
    return `# Error Converting Output\n\nThere was an error converting the structured output to markdown. Raw data: \n\n\`\`\`json\n${JSON.stringify(
      data,
      null,
      2,
    )}\n\`\`\``
  }
}

export async function processOutput(fileAttachments: FileAttachment[], outputType: OutputType) {
  // Create file parts for each attachment
  const fileParts = fileAttachments.map((file) => ({
    type: "file" as const,
    data: file.data,
    mimeType: file.contentType,
  }))

  // Create messages array for the specified output type
  const messages = [
    {
      role: "system" as const,
      content: prompts[outputType].system,
    },
    {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: prompts[outputType].prompt,
        },
        ...fileParts,
      ],
    },
  ]

  try {
    // Use generateObject with the appropriate schema
    const result = await generateObject({
      model: gemini,
      messages,
      schema: schemaMap[outputType],
    })

    // Convert the structured output to markdown
    return convertToMarkdown(outputType, result.object)
  } catch (error) {
    console.error("Error generating content:", error)
    throw new Error(`Failed to generate ${outputType}: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Helper function to strip HTML tags for plain text
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "")
}

// Parse HTML content and apply styling to PDF
export async function generatePDF(content: string, title: string) {
  const doc = new jsPDF()
  const isHtml = content.includes("<") && content.includes(">")

  if (!isHtml) {
    // Handle plain text content
    doc.setFontSize(16)
    doc.text(title, 20, 20)
    doc.setFontSize(12)
    const splitText = doc.splitTextToSize(content, 170)
    doc.text(splitText, 20, 30)
    return doc.output("datauristring")
  }

  // Parse HTML content
  const dom = new JSDOM(`<div id="content">${content}</div>`)
  const elements = dom.window.document.querySelectorAll("#content > *")

  // Set up initial PDF state
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(title, 20, 20)

  let yPosition = 40 // Start position after title
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const textWidth = pageWidth - margin * 2

  // Process each element
  elements.forEach((element) => {
    const tagName = element.tagName.toLowerCase()
    const text = element.textContent || ""

    // Check if we need a new page
    if (yPosition > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      yPosition = 20
    }

    // Apply styling based on element type
    switch (tagName) {
      case "h1":
        doc.setFontSize(18)
        doc.setFont("helvetica", "bold")
        doc.text(text, margin, yPosition)
        yPosition += 10
        break

      case "h2":
        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text(text, margin, yPosition)
        yPosition += 8
        break

      case "h3":
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text(text, margin, yPosition)
        yPosition += 7
        break

      case "p":
        doc.setFontSize(12)
        doc.setFont("helvetica", "normal")

        // Handle styled text within paragraphs
        const plainText = text
        if (element.querySelector("strong, b")) {
          // This is a simplification - in a real app you'd want to preserve
          // the exact positions of bold text, not just make the whole paragraph bold
          doc.setFont("helvetica", "bold")
        }
        if (element.querySelector("em, i")) {
          // Similarly for italic text
          doc.setFont("helvetica", "italic")
        }

        const splitText = doc.splitTextToSize(plainText, textWidth)
        doc.text(splitText, margin, yPosition)
        yPosition += splitText.length * 7 + 5 // Add space after paragraph
        break

      case "ul":
      case "ol":
        doc.setFontSize(12)
        doc.setFont("helvetica", "normal")
        const listItems = element.querySelectorAll("li")
        listItems.forEach((item, index) => {
          const prefix = tagName === "ul" ? "• " : `${index + 1}. `
          const itemText = prefix + (item.textContent || "")
          const splitItemText = doc.splitTextToSize(itemText, textWidth - 5)

          // Check if we need a new page
          if (yPosition > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage()
            yPosition = 20
          }

          doc.text(splitItemText, margin, yPosition)
          yPosition += splitItemText.length * 7 + 2
        })
        yPosition += 5 // Add space after list
        break

      case "blockquote":
        doc.setFontSize(12)
        doc.setFont("helvetica", "italic")
        const quoteText = doc.splitTextToSize(text, textWidth - 10)

        // Draw a line for the blockquote
        doc.setDrawColor(200, 200, 200)
        doc.line(margin - 5, yPosition - 5, margin - 5, yPosition + quoteText.length * 7 + 5)

        doc.text(quoteText, margin, yPosition)
        yPosition += quoteText.length * 7 + 10
        break

      default:
        // Handle other elements as plain text
        if (text.trim()) {
          doc.setFontSize(12)
          doc.setFont("helvetica", "normal")
          const splitText = doc.splitTextToSize(text, textWidth)
          doc.text(splitText, margin, yPosition)
          yPosition += splitText.length * 7 + 3
        }
    }
  })

  // Return base64 encoded PDF
  return doc.output("datauristring")
}

export async function generateDOCX(content: string, title: string) {
  const isHtml = content.includes("<") && content.includes(">")

  if (!isHtml) {
    // Handle plain text content
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: content,
                  size: 24,
                }),
              ],
            }),
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    const base64 = Buffer.from(buffer).toString("base64")
    return `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`
  }

  // Parse HTML content
  const dom = new JSDOM(`<div id="content">${content}</div>`)
  const elements = dom.window.document.querySelectorAll("#content > *")

  // Create document with title
  const children = [
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
  ]

  // Process each element
  elements.forEach((element) => {
    const tagName = element.tagName.toLowerCase()
    const text = element.textContent || ""

    if (!text.trim()) return

    // Apply styling based on element type
    switch (tagName) {
      case "h1":
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: text,
                bold: true,
                size: 32,
              }),
            ],
          }),
        )
        break

      case "h2":
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: text,
                bold: true,
                size: 28,
              }),
            ],
          }),
        )
        break

      case "h3":
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [
              new TextRun({
                text: text,
                bold: true,
                size: 26,
              }),
            ],
          }),
        )
        break

      case "p":
        const runs = []

        // Check for formatting
        if (element.querySelector("strong, b")) {
          runs.push(
            new TextRun({
              text: text,
              bold: true,
              size: 24,
            }),
          )
        } else if (element.querySelector("em, i")) {
          runs.push(
            new TextRun({
              text: text,
              italics: true,
              size: 24,
            }),
          )
        } else {
          runs.push(
            new TextRun({
              text: text,
              size: 24,
            }),
          )
        }

        children.push(
          new Paragraph({
            children: runs,
          }),
        )
        break

      case "ul":
      case "ol":
        const listItems = element.querySelectorAll("li")
        listItems.forEach((item, index) => {
          const prefix = tagName === "ul" ? "• " : `${index + 1}. `
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: prefix + (item.textContent || ""),
                  size: 24,
                }),
              ],
              indent: {
                left: 720, // 0.5 inches in twips
              },
            }),
          )
        })
        break

      case "blockquote":
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text,
                italics: true,
                size: 24,
              }),
            ],
            indent: {
              left: 720, // 0.5 inches in twips
            },
            border: {
              left: {
                color: "999999",
                size: 6,
                style: "single",
              },
            },
          }),
        )
        break

      default:
        // Handle other elements as plain text
        if (text.trim()) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: text,
                  size: 24,
                }),
              ],
            }),
          )
        }
    }
  })

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  })

  // Generate buffer
  const buffer = await Packer.toBuffer(doc)

  // Convert buffer to base64
  const base64 = Buffer.from(buffer).toString("base64")

  // Return as data URI
  return `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`
}
