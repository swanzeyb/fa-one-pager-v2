'use server'

import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { generateUnifiedDocument } from '@/lib/document-generator'
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

      // Create model
      const model = google('gemini-2.0-flash')

      // Create messages array for the specified output type
      const messages = [
        {
          role: 'system' as const,
          content:
            prompts[outputType].system +
            (isRegeneration
              ? ' For this regeneration, provide a fresh perspective with different wording and structure than previous versions.'
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

      // Use generateText instead of generateObject for more reliable results
      const result = await generateText({
        model: model,
        messages,
        temperature: adjustedTemperature, // Temperature configuration goes here
      })

      // Validate that we got some content
      if (!result.text || result.text.trim().length < 50) {
        throw new Error('Generated content is too short or empty')
      }

      // Return the HTML content directly
      return result.text
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
  return generateUnifiedDocument(content, title, 'pdf')
}

export async function generateDOCX(content: string, title: string) {
  return generateUnifiedDocument(content, title, 'docx')
}
