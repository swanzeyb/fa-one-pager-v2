"use server"

import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { jsPDF } from "jspdf"
import { Document, Packer, Paragraph, TextRun } from "docx"
import prompts from "./prompts.json"

export type OutputType = "shortSummary" | "mediumSummary" | "howToGuide"

export type FileAttachment = {
  name: string
  contentType: string
  data: string
}

export async function processFiles(fileAttachments: FileAttachment[]) {
  // Create file parts for each attachment
  const fileParts = fileAttachments.map((file) => ({
    type: "file" as const,
    data: file.data,
    mimeType: file.contentType,
  }))

  // Create messages arrays for each output type
  const shortSummaryMessages = [
    {
      role: "system" as const,
      content: prompts.shortSummary.system,
    },
    {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: prompts.shortSummary.prompt,
        },
        ...fileParts,
      ],
    },
  ]

  const mediumSummaryMessages = [
    {
      role: "system" as const,
      content: prompts.mediumSummary.system,
    },
    {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: prompts.mediumSummary.prompt,
        },
        ...fileParts,
      ],
    },
  ]

  const howToGuideMessages = [
    {
      role: "system" as const,
      content: prompts.howToGuide.system,
    },
    {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: prompts.howToGuide.prompt,
        },
        ...fileParts,
      ],
    },
  ]

  const [shortSummary, mediumSummary, howToGuide] = await Promise.all([
    generateText({
      model: google("gemini-2.0-flash"),
      messages: shortSummaryMessages,
    }),
    generateText({
      model: google("gemini-2.0-flash"),
      messages: mediumSummaryMessages,
    }),
    generateText({
      model: google("gemini-2.0-flash"),
      messages: howToGuideMessages,
    }),
  ])

  return {
    shortSummary: shortSummary.text,
    mediumSummary: mediumSummary.text,
    howToGuide: howToGuide.text,
  }
}

export async function refreshOutput(fileAttachments: FileAttachment[], outputType: OutputType) {
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

  const result = await generateText({
    model: google("gemini-2.0-flash"),
    messages: messages,
  })

  return result.text
}

export async function generatePDF(content: string, title: string) {
  const doc = new jsPDF()

  // Add title
  doc.setFontSize(16)
  doc.text(title, 20, 20)

  // Add content with word wrapping
  doc.setFontSize(12)
  const splitText = doc.splitTextToSize(content, 170)
  doc.text(splitText, 20, 30)

  // Return base64 encoded PDF
  return doc.output("datauristring")
}

export async function generateDOCX(content: string, title: string) {
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
                text: content,
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
