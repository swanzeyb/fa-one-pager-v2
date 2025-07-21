// File Service: Pure utility functions for file handling
// No React dependencies
import type { FileAttachment } from '../stores/types'

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
]

export function validateFileTypes(files: File[]): {
  valid: File[]
  invalid: File[]
} {
  const valid: File[] = []
  const invalid: File[] = []
  files.forEach((file) => {
    if (ALLOWED_FILE_TYPES.includes(file.type)) {
      valid.push(file)
    } else {
      invalid.push(file)
    }
  })
  return { valid, invalid }
}

export function convertToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function prepareFileAttachments(
  files: File[]
): Promise<FileAttachment[]> {
  const attachments: FileAttachment[] = []
  for (const file of files) {
    const data = await convertToDataURL(file)
    attachments.push({
      name: file.name,
      contentType: file.type,
      data,
    })
  }
  return attachments
}
