// Firebase AI Service: Client-side AI processing using Firebase AI Logic
import { getGenerativeModel } from 'firebase/ai'
import { vertexAI } from '@/lib/firebase'
import { getPromptForType } from '@/lib/prompts'
import type { FileAttachment, OutputType } from '@/app/actions'

// Firebase AI model configuration
const getModel = (temperature: number = 0.3) => {
  return getGenerativeModel(vertexAI, {
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  })
}

// Convert file attachments to Firebase format
function prepareFileData(attachments: FileAttachment[]) {
  const parts = []

  for (const file of attachments) {
    try {
      // For Firebase AI Logic, we need to prepare file data differently
      if (file.contentType.startsWith('image/')) {
        parts.push({
          inlineData: {
            data: file.data.split(',')[1], // Remove data URL prefix
            mimeType: file.contentType,
          },
        })
      } else {
        // For text files, include as text
        const textContent = atob(file.data.split(',')[1]) // Decode base64
        parts.push({
          text: `File: ${file.name}\nContent: ${textContent}`,
        })
      }
    } catch (error) {
      console.warn(`Could not process file ${file.name}:`, error)
    }
  }

  return parts
}

// Main AI processing function
export async function processOutputWithFirebase(
  fileAttachments: FileAttachment[],
  outputType: OutputType,
  isRegeneration = false
): Promise<string> {
  // Validate input
  if (!fileAttachments || fileAttachments.length === 0) {
    throw new Error('No file attachments provided')
  }

  // Prepare file data for Firebase
  const fileParts = prepareFileData(fileAttachments)

  if (fileParts.length === 0) {
    throw new Error('No valid files could be processed')
  }

  // Load the correct prompt for this output type
  const promptConfig = getPromptForType(outputType)

  // Create system prompt with regeneration instructions
  const systemPrompt =
    promptConfig.system +
    (isRegeneration
      ? ' Please make this regeneration noticeably different from previous versions.'
      : '')

  try {
    // Adjust temperature for regeneration
    const temperature = isRegeneration ? 0.7 : 0.3
    const model = getModel(temperature)

    // Create the prompt parts
    const promptParts = [
      { text: systemPrompt },
      ...fileParts,
      { text: promptConfig.prompt },
    ]

    // Generate content using Firebase AI Logic
    const result = await model.generateContent(promptParts)
    const response = await result.response
    const text = response.text()

    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from AI model')
    }

    return text
  } catch (error) {
    console.error('Firebase AI processing error:', error)
    throw new Error(
      `AI processing failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

// Retry wrapper function
export async function retryFirebaseAI<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  let lastError

  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      console.warn(`Attempt ${i + 1} failed:`, err)

      // Wait before retrying (exponential backoff)
      if (i < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        )
      }
    }
  }

  throw lastError
}

// Export the main function with retry logic
export async function processOutput(
  fileAttachments: FileAttachment[],
  outputType: OutputType,
  isRegeneration = false
): Promise<string> {
  return retryFirebaseAI(
    () =>
      processOutputWithFirebase(fileAttachments, outputType, isRegeneration),
    3
  )
}
