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

// Document generation functions are available in @/app/actions
// Import them from there if needed

// Retry function - now uses Firebase AI retry logic
export async function retryAI<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  // Import retry logic from Firebase AI service
  const { retryFirebaseAI } = await import('./firebase-ai-service')
  return retryFirebaseAI(fn, retries)
}
