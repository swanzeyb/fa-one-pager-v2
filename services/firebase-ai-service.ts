// Firebase AI Service: Client-side AI processing using Firebase AI Logic (No API Keys Required)
import { getGenerativeModel } from 'firebase/ai'
import { ai } from '@/lib/firebase'
import { getPromptForType } from '@/lib/prompts'
import type { FileAttachment, OutputType } from '@/app/actions'

// Configuration
const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB - safe limit for inline data
const MAX_TOTAL_SIZE = 30 * 1024 * 1024 // 30MB - total request size limit

const getModel = (temperature: number = 0.3) => {
  return getGenerativeModel(ai, {
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature,
      topK: 40,
      topP: 0.95,
    },
  })
}

// Compress image if it's too large
async function compressImageIfNeeded(
  attachment: FileAttachment
): Promise<FileAttachment> {
  if (!attachment.contentType.startsWith('image/')) {
    return attachment
  }

  // Calculate file size from base64
  const base64Data = attachment.data.split(',')[1]
  const fileSize = (base64Data.length * 3) / 4

  // If file is small enough, return as-is
  if (fileSize <= MAX_FILE_SIZE) {
    return attachment
  }

  console.log(
    `Compressing large image ${attachment.name} (${Math.round(
      fileSize / 1024 / 1024
    )}MB)`
  )

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      // Calculate new dimensions (maintain aspect ratio, max 2048x2048)
      const maxDimension = 2048
      const scale = Math.min(
        maxDimension / img.width,
        maxDimension / img.height,
        1
      )

      canvas.width = img.width * scale
      canvas.height = img.height * scale

      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Try different quality levels until we get under the size limit
      let quality = 0.8
      let compressedData = ''

      do {
        compressedData = canvas.toDataURL('image/jpeg', quality)
        const compressedSize = (compressedData.split(',')[1].length * 3) / 4

        if (compressedSize <= MAX_FILE_SIZE) break
        quality -= 0.1
      } while (quality > 0.1)

      resolve({
        ...attachment,
        data: compressedData,
        contentType: 'image/jpeg',
        name: attachment.name.replace(/\.[^/.]+$/, '') + '_compressed.jpg',
      })
    }

    img.src = attachment.data
  })
}

// Handle PDF and other document files
async function processPDFFile(
  attachment: FileAttachment
): Promise<FileAttachment> {
  // For PDFs and other documents, we'll pass them as binary data to the model
  // Gemini can handle PDFs directly through inline data
  try {
    const base64Data = attachment.data.split(',')[1]
    const fileSize = (base64Data.length * 3) / 4

    if (fileSize > MAX_FILE_SIZE) {
      console.warn(
        `PDF file ${attachment.name} is too large (${Math.round(
          fileSize / 1024 / 1024
        )}MB), may cause issues`
      )
    }

    return attachment // Return as-is, Gemini handles PDF parsing
  } catch (error) {
    console.warn(`Error processing PDF file ${attachment.name}:`, error)
    return attachment
  }
}

// Truncate text files if they're too large
function truncateTextIfNeeded(attachment: FileAttachment): FileAttachment {
  if (
    attachment.contentType.startsWith('image/') ||
    attachment.contentType === 'application/pdf'
  ) {
    return attachment
  }

  try {
    const base64Data = attachment.data.split(',')[1]
    const textContent = atob(base64Data)
    const maxChars = 50000 // Reasonable limit for text content

    if (textContent.length <= maxChars) {
      return attachment
    }

    console.log(
      `Truncating large text file ${attachment.name} (${textContent.length} chars -> ${maxChars} chars)`
    )

    const truncatedContent =
      textContent.substring(0, maxChars) +
      '\n\n[... file truncated due to size ...]'
    const newBase64 = btoa(truncatedContent)
    const newDataUrl = `data:${attachment.contentType};base64,${newBase64}`

    return {
      ...attachment,
      data: newDataUrl,
      name: attachment.name + '_truncated',
    }
  } catch (error) {
    console.warn(`Error truncating text file ${attachment.name}:`, error)
    return attachment
  }
}

// Enhanced file preparation with size optimization
async function prepareFileData(attachments: FileAttachment[]) {
  const parts = []
  let totalSize = 0

  // First pass: optimize files
  const optimizedAttachments = []
  for (const attachment of attachments) {
    try {
      let optimized = attachment

      // Handle different file types
      if (attachment.contentType.startsWith('image/')) {
        optimized = await compressImageIfNeeded(attachment)
      } else if (attachment.contentType === 'application/pdf') {
        optimized = await processPDFFile(attachment)
      } else {
        optimized = truncateTextIfNeeded(attachment)
      }

      const base64Data = optimized.data.split(',')[1]
      const fileSize = (base64Data.length * 3) / 4

      // Check if we're approaching total size limit
      if (totalSize + fileSize > MAX_TOTAL_SIZE) {
        console.warn(
          `Skipping file ${optimized.name} - would exceed total size limit`
        )
        continue
      }

      totalSize += fileSize
      optimizedAttachments.push(optimized)
    } catch (error) {
      console.warn(`Could not optimize file ${attachment.name}:`, error)
    }
  }

  // Second pass: convert to prompt parts
  for (const attachment of optimizedAttachments) {
    try {
      // Handle all file types with inline data (no Files API needed)
      parts.push({
        inlineData: {
          data: attachment.data.split(',')[1],
          mimeType: attachment.contentType,
        },
      })
    } catch (error) {
      console.warn(
        `Could not process optimized file ${attachment.name}:`,
        error
      )
    }
  }

  console.log(`Total payload size: ${Math.round(totalSize / 1024 / 1024)}MB`)
  return parts
}

// File size validation before processing
export function validateFileAttachments(attachments: FileAttachment[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  let totalSize = 0

  for (const attachment of attachments) {
    const base64Data = attachment.data.split(',')[1]
    const fileSize = (base64Data.length * 3) / 4

    if (fileSize > 100 * 1024 * 1024) {
      // 100MB absolute limit
      errors.push(
        `File ${attachment.name} is too large (${Math.round(
          fileSize / 1024 / 1024
        )}MB). Maximum individual file size is 100MB.`
      )
    }

    totalSize += fileSize
  }

  if (totalSize > MAX_TOTAL_SIZE * 2) {
    // Even after compression, unlikely to fit
    errors.push(
      `Total file size is too large (${Math.round(
        totalSize / 1024 / 1024
      )}MB). Consider removing some files.`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Main AI processing function (enhanced with validation)
export async function processOutputWithFirebase(
  fileAttachments: FileAttachment[],
  outputType: OutputType,
  isRegeneration = false
): Promise<string> {
  if (!fileAttachments || fileAttachments.length === 0) {
    throw new Error('No file attachments provided')
  }

  // Validate files before processing
  const validation = validateFileAttachments(fileAttachments)
  if (!validation.valid) {
    throw new Error(`File validation failed:\n${validation.errors.join('\n')}`)
  }

  // Prepare file data with optimization
  const fileParts = await prepareFileData(fileAttachments)

  if (fileParts.length === 0) {
    throw new Error('No valid files could be processed after optimization')
  }

  const promptConfig = getPromptForType(outputType)
  const systemPrompt =
    promptConfig.system +
    (isRegeneration
      ? ' Please make this regeneration noticeably different from previous versions.'
      : '')

  try {
    const temperature = isRegeneration ? 0.7 : 0.3
    const model = getModel(temperature)

    const promptParts = [
      { text: systemPrompt },
      ...fileParts,
      { text: promptConfig.prompt },
    ]

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

// Rest of your existing retry logic...
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

      if (i < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        )
      }
    }
  }

  throw lastError
}

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
