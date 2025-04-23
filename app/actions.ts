"use server"

import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { jsPDF } from "jspdf"
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx"
import prompts from "./prompts.json"
import { z } from "zod"

export type OutputType = "shortSummary" | "mediumSummary" | "howToGuide"

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

        // Using string concatenation instead of template literals to avoid any potential issues
        const images = output.images
          .map(
            (image) =>
              "![" +
              image.caption +
              "](/placeholder.svg?height=300&width=500&query=" +
              encodeURIComponent(image.description) +
              ")\n\n*" +
              image.caption +
              "*",
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

// Helper function to process structured elements for PDF generation
function processStructuredElements(
  elements: StructuredElement[],
  doc: jsPDF,
  yPosition: number,
  margin: number,
  textWidth: number,
): number {
  let currentY = yPosition

  for (const element of elements) {
    // Check if we need a new page
    if (currentY > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      currentY = 20
    }

    switch (element.type) {
      case "h1":
        doc.setFontSize(18)
        doc.setFont("helvetica", "bold")
        doc.text(element.content, margin, currentY)
        currentY += 10
        break

      case "h2":
        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text(element.content, margin, currentY)
        currentY += 8
        break

      case "h3":
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text(element.content, margin, currentY)
        currentY += 7
        break

      case "p":
        doc.setFontSize(12)
        doc.setFont("helvetica", "normal")
        const splitText = doc.splitTextToSize(element.content, textWidth)
        doc.text(splitText, margin, currentY)
        currentY += splitText.length * 7 + 5 // Add space after paragraph
        break

      case "ul":
      case "ol":
        if (element.children) {
          doc.setFontSize(12)
          doc.setFont("helvetica", "normal")

          element.children.forEach((item, index) => {
            if (item.type === "li") {
              const prefix = element.type === "ul" ? "• " : `${index + 1}. `
              const itemText = prefix + item.content
              const splitItemText = doc.splitTextToSize(itemText, textWidth - 5)

              // Check if we need a new page
              if (currentY > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage()
                currentY = 20
              }

              doc.text(splitItemText, margin, currentY)
              currentY += splitItemText.length * 7 + 2
            }
          })

          currentY += 5 // Add space after list
        }
        break

      case "img":
        // Handle images (simplified)
        currentY += 40 // Placeholder for image height
        break

      case "text":
        if (element.content.trim()) {
          doc.setFontSize(12)
          doc.setFont("helvetica", "normal")
          const splitText = doc.splitTextToSize(element.content, textWidth)
          doc.text(splitText, margin, currentY)
          currentY += splitText.length * 7 + 3
        }
        break

      default:
        // Process children if available
        if (element.children && element.children.length > 0) {
          currentY = processStructuredElements(element.children, doc, currentY, margin, textWidth)
        }
    }
  }

  return currentY
}

// Parse HTML content and apply styling to PDF
export async function generatePDF(content: string, title: string) {
  const doc = new jsPDF()

  // Set up initial PDF state
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(title, 20, 20)

  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const textWidth = pageWidth - margin * 2

  try {
    // Try to parse the content as structured elements
    // In a real implementation, you would receive structured elements directly
    // For now, we'll assume content is HTML and parse it on the client

    // For simplicity, we'll just handle basic text content
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    const splitText = doc.splitTextToSize(content.replace(/<[^>]*>/g, ""), textWidth)
    doc.text(splitText, margin, 40)
  } catch (error) {
    console.error("Error generating PDF:", error)
    // Fallback to simple text
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text("Error processing content. Please try again.", margin, 40)
  }

  // Return base64 encoded PDF
  return doc.output("datauristring")
}

export async function generateDOCX(content: string, title: string) {
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

  try {
    // For simplicity, we'll just add the content as plain text
    // In a real implementation, you would process the structured elements
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: content.replace(/<[^>]*>/g, ""),
            size: 24,
          }),
        ],
      }),
    )
  } catch (error) {
    console.error("Error generating DOCX:", error)
    // Fallback to error message
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Error processing content. Please try again.",
            size: 24,
          }),
        ],
      }),
    )
  }

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
