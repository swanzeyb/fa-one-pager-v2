import type { FileAttachment } from '@/app/actions'

// Step type (1 | 2 | 3)
export type Step = 1 | 2 | 3

// File validation constants
export const ALLOWED_FILE_TYPES = [
  'application/pdf', // PDF
  'text/plain', // TXT
] as const

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number]

export type { FileAttachment }
