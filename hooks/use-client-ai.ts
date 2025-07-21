// Hook for client-side AI processing
'use client'

import { useState, useCallback } from 'react'
import {
  processOutput,
  generateDOCX,
  generatePDF,
  downloadFile,
} from '@/app/client-actions'
import type { FileAttachment, OutputType } from '@/app/actions'

export interface UseClientAIReturn {
  isProcessing: boolean
  isGeneratingDoc: boolean
  processFiles: (
    files: FileAttachment[],
    outputType: OutputType,
    isRegeneration?: boolean
  ) => Promise<string>
  downloadDOCX: (content: string, title: string) => Promise<void>
  downloadPDF: (content: string, title: string) => Promise<void>
  error: string | null
  clearError: () => void
}

export function useClientAI(): UseClientAIReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const processFiles = useCallback(
    async (
      files: FileAttachment[],
      outputType: OutputType,
      isRegeneration = false
    ): Promise<string> => {
      setIsProcessing(true)
      setError(null)

      try {
        const result = await processOutput(files, outputType, isRegeneration)
        return result
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'AI processing failed'
        setError(errorMessage)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const downloadDOCX = useCallback(async (content: string, title: string) => {
    setIsGeneratingDoc(true)
    setError(null)

    try {
      const url = await generateDOCX(content, title)
      downloadFile(url, `${title}.docx`)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'DOCX generation failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsGeneratingDoc(false)
    }
  }, [])

  const downloadPDF = useCallback(async (content: string, title: string) => {
    setIsGeneratingDoc(true)
    setError(null)

    try {
      const url = await generatePDF(content, title)
      downloadFile(url, `${title}.pdf`)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'PDF generation failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsGeneratingDoc(false)
    }
  }, [])

  return {
    isProcessing,
    isGeneratingDoc,
    processFiles,
    downloadDOCX,
    downloadPDF,
    error,
    clearError,
  }
}
