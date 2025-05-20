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

// Create model instances with different temperatures
const standardModel = google("gemini-2.0-flash", {
  temperature: 0.3,
})

const creativeModel = google("gemini-2.0-flash", {
  temperature: 0.7, // Higher temperature for more creative/varied outputs
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

// Updated schema to remove images
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

// Convert structured output to HTML
function convertToHtml(outputType: OutputType, data: any): string {
  try {
    switch (outputType) {
      case "shortSummary": {
        const output = data as ShortSummaryOutput
        // Remove the newline between title and paragraphs
        return `<h1>${output.title}</h1>${output.paragraphs.map((p) => `<p>${p}</p>`).join("")}`
      }
      case "mediumSummary": {
        const output = data as MediumSummaryOutput
        // Remove the newline between title and paragraphs
        return `<h1>${output.title}</h1>${output.paragraphs.map((p) => `<p>${p}</p>`).join("")}`
      }
      case "howToGuide": {
        const output = data as HowToGuideOutput

        const steps = output.steps.map((step, index) => `<li>${step}</li>`).join("")
        const authors = output.authors.map((author) => `<p>${author}</p>`).join("")

        // Remove unnecessary newlines between elements
        return `<h1>How-to Guide</h1><p>${output.introduction}</p><h2>Steps</h2><ol>${steps}</ol><h2>Authors</h2>${authors}`
      }
      default:
        return "<p>Error: Unknown output type</p>"
    }
  } catch (error) {
    console.error("Error converting to HTML:", error)
    return `<h1>Error Converting Output</h1><p>There was an error converting the structured output to HTML. Raw data:</p><pre>${JSON.stringify(data, null, 2)}</pre>`
  }
}

export async function processOutput(fileAttachments: FileAttachment[], outputType: OutputType, isRegeneration = false) {
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
      content:
        prompts[outputType].system +
        (isRegeneration
          ? " For this regeneration, provide a fresh perspective with different wording and structure than previous versions."
          : ""),
    },
    {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text:
            prompts[outputType].prompt +
            (isRegeneration ? " Please make this regeneration noticeably different from previous versions." : ""),
        },
        ...fileParts,
      ],
    },
  ]

  try {
    // Use generateObject with the appropriate schema and model based on whether it's a regeneration
    const result = await generateObject({
      model: isRegeneration ? creativeModel : standardModel, // Use higher temperature for regeneration
      messages,
      schema: schemaMap[outputType],
    })

    // Convert the structured output to HTML
    return convertToHtml(outputType, result.object)
  } catch (error) {
    console.error("Error generating content:", error)
    throw new Error(`Failed to generate ${outputType}: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
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
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.text(title, margin, yPosition)
  yPosition += 15

  try {
    // Create a temporary DOM element to parse the HTML
    const parser = new DOMParser()
    const htmlDoc = parser.parseFromString(content, "text/html")
    const elements = htmlDoc.body.childNodes

    // Track if we've seen the first h1 to avoid duplicating the title
    let firstH1Processed = false

    // Process each element and apply appropriate styling
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLElement

      // Skip text nodes and non-element nodes
      if (element.nodeType !== Node.ELEMENT_NODE) continue

      // Get the text content
      const text = element.textContent || ""
      if (!text.trim()) continue

      // Apply styling based on tag type
      switch (element.tagName.toLowerCase()) {
        case "h1":
          // Skip the first h1 if it's similar to the title to avoid duplication
          if (!firstH1Processed) {
            firstH1Processed = true
            // If the h1 content is very similar to the title, skip it
            if (text.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(text.toLowerCase())) {
              continue
            }
          }

          // Check if we need a page break
          if (yPosition > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage()
            yPosition = margin
          }

          doc.setFont("helvetica", "bold")
          doc.setFontSize(18)
          const h1Lines = doc.splitTextToSize(text, textWidth)
          doc.text(h1Lines, margin, yPosition)
          yPosition += 7 * h1Lines.length + 5
          break

        case "h2":
          // Check if we need a page break
          if (yPosition > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage()
            yPosition = margin
          }

          doc.setFont("helvetica", "bold")
          doc.setFontSize(16)
          const h2Lines = doc.splitTextToSize(text, textWidth)
          doc.text(h2Lines, margin, yPosition)
          yPosition += 6 * h2Lines.length + 4
          break

        case "p":
          // Check if we need a page break
          if (yPosition > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage()
            yPosition = margin
          }

          doc.setFont("helvetica", "normal")
          doc.setFontSize(12)
          const pLines = doc.splitTextToSize(text, textWidth)
          doc.text(pLines, margin, yPosition)
          yPosition += 5 * pLines.length + 5
          break

        case "ol":
        case "ul":
          // Process list items
          const listItems = element.getElementsByTagName("li")
          for (let j = 0; j < listItems.length; j++) {
            // Check if we need a page break
            if (yPosition > doc.internal.pageSize.getHeight() - 40) {
              doc.addPage()
              yPosition = margin
            }

            const itemText = listItems[j].textContent || ""
            doc.setFont("helvetica", "normal")
            doc.setFontSize(12)

            // Format based on list type
            const prefix = element.tagName.toLowerCase() === "ol" ? `${j + 1}. ` : "• "
            const formattedText = prefix + itemText

            // Removed left margin for list items - now aligned with the main margin
            const liLines = doc.splitTextToSize(formattedText, textWidth)
            doc.text(liLines, margin, yPosition)
            yPosition += 5 * liLines.length + 3
          }
          yPosition += 2 // Add extra space after list
          break

        case "li":
          // Individual list items are handled within ol/ul processing
          break

        default:
          // Handle other elements as paragraphs
          if (yPosition > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage()
            yPosition = margin
          }

          doc.setFont("helvetica", "normal")
          doc.setFontSize(12)
          const defaultLines = doc.splitTextToSize(text, textWidth)
          doc.text(defaultLines, margin, yPosition)
          yPosition += 5 * defaultLines.length + 3
      }
    }
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
    // Create a temporary DOM element to parse the HTML
    const parser = new DOMParser()
    const htmlDoc = parser.parseFromString(content, "text/html")
    const elements = htmlDoc.body.childNodes

    // Track if we've seen the first h1 to avoid duplicating the title
    let firstH1Processed = false

    // Process each element and apply appropriate styling
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLElement

      // Skip text nodes and non-element nodes
      if (element.nodeType !== Node.ELEMENT_NODE) continue

      // Get the text content
      const text = element.textContent || ""
      if (!text.trim()) continue

      // Apply styling based on tag type
      switch (element.tagName.toLowerCase()) {
        case "h1":
          // Skip the first h1 if it's similar to the title to avoid duplication
          if (!firstH1Processed) {
            firstH1Processed = true
            // If the h1 content is very similar to the title, skip it
            if (text.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(text.toLowerCase())) {
              continue
            }
          }

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
              spacing: {
                after: 200,
              },
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
              spacing: {
                after: 200,
              },
            }),
          )
          break

        case "p":
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: text,
                  size: 24,
                }),
              ],
              spacing: {
                after: 200,
              },
            }),
          )
          break

        case "ol":
        case "ul":
          // Process list items
          const listItems = element.getElementsByTagName("li")
          for (let j = 0; j < listItems.length; j++) {
            const itemText = listItems[j].textContent || ""

            // Format based on list type
            const prefix = element.tagName.toLowerCase() === "ol" ? `${j + 1}. ` : "• "

            children.push(
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
                // Removed the left indent completely
                indent: {
                  left: 0,
                },
              }),
            )
          }
          break

        default:
          // Handle other elements as paragraphs
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
