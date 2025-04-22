"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { jsPDF } from "jspdf"
import { Document, Packer, Paragraph, TextRun } from "docx"

export async function processFiles(fileContents: string[]) {
  const combinedContent = fileContents.join("\n\n")

  const [shortSummary, mediumSummary, howToGuide] = await Promise.all([
    generateText({
      model: openai("gpt-4o"),
      prompt: `Provide a short summary (2-3 sentences) of the following content:\n\n${combinedContent}`,
    }),
    generateText({
      model: openai("gpt-4o"),
      prompt: `Provide a medium-length summary (1-2 paragraphs) of the following content:\n\n${combinedContent}`,
    }),
    generateText({
      model: openai("gpt-4o"),
      prompt: `Create a how-to guide based on the following content:\n\n${combinedContent}`,
    }),
  ])

  return {
    shortSummary: shortSummary.text,
    mediumSummary: mediumSummary.text,
    howToGuide: howToGuide.text,
  }
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
