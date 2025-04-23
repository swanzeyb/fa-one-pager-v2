"use server"

import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { jsPDF } from "jspdf"
import { Document, Packer, Paragraph, TextRun } from "docx"
import prompts from "./prompts.json"
import { z } from "zod"

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

export async function generatePDF(content: string, title: string) {
  const doc = new jsPDF()

  // Check if content is HTML (from the editor)
  const isHtml = content.includes("<") && content.includes(">")
  const textContent = isHtml ? stripHtml(content) : content

  // Add title
  doc.setFontSize(16)
  doc.text(title, 20, 20)

  // Add content with word wrapping
  doc.setFontSize(12)
  const splitText = doc.splitTextToSize(textContent, 170)
  doc.text(splitText, 20, 30)

  // Return base64 encoded PDF
  return doc.output("datauristring")
}

export async function generateDOCX(content: string, title: string) {
  // Check if content is HTML (from the editor)
  const isHtml = content.includes("<") && content.includes(">")
  const textContent = isHtml ? stripHtml(content) : content

  // Create document
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
                text: textContent,
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
  const base64 = Buffer.from(buffer).toString("base64")

  // Return as data URI
  return `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`
}
