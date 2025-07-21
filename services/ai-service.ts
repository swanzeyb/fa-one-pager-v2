// AI Service: Async functions for AI processing and document generation
// Now uses Firebase AI Logic for client-side processing
import type { FileAttachment, OutputType } from '@/app/actions'
import { processOutput as firebaseProcessOutput } from './firebase-ai-service'

// Main processing function - now uses Firebase AI Logic
export async function processOutput(
  attachments: FileAttachment[],
  type: OutputType,
  isRegeneration = false
): Promise<string> {
  // Use Firebase AI Logic instead of server actions
  return firebaseProcessOutput(attachments, type, isRegeneration)
}

// These document generation functions will be updated in Stage 6
// For now, keep them as stubs
export async function generateDOCX(
  content: string,
  title: string
): Promise<string> {
  // TODO: Move to client-side implementation in Stage 6
  throw new Error('DOCX generation not yet migrated to client-side')
}

export async function generatePDF(
  content: string,
  title: string
): Promise<string> {
  // TODO: Move to client-side implementation in Stage 6
  throw new Error('PDF generation not yet migrated to client-side')
}

// Retry function - now uses Firebase AI retry logic
export async function retryAI<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  // Import retry logic from Firebase AI service
  const { retryFirebaseAI } = await import('./firebase-ai-service')
  return retryFirebaseAI(fn, retries)
}
