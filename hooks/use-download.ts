'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { generatePDF, generateDOCX, type OutputType } from '@/app/actions'
import { analytics } from '@/lib/posthog'

export type DownloadFormat = 'pdf' | 'docx'
export type DownloadType = OutputType | 'combined'

export interface DownloadOptions {
  content: string
  title: string
  outputType?: OutputType
  downloadType?: DownloadType
  format: DownloadFormat
}

export interface DownloadState {
  isDownloading: boolean
  progress?: number
  error?: string | null
}

export function useDownload() {
  const { toast } = useToast()
  const [state, setState] = useState<DownloadState>({
    isDownloading: false,
    error: null,
  })

  const resetState = useCallback(() => {
    setState({
      isDownloading: false,
      error: null,
    })
  }, [])

  const updateState = useCallback((updates: Partial<DownloadState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  const generateFilename = useCallback(
    (title: string, format: DownloadFormat): string => {
      const sanitizedTitle = title.toLowerCase().replace(/\s+/g, '-')
      return `${sanitizedTitle}.${format}`
    },
    []
  )

  const createDownloadLink = useCallback(
    async (dataUri: string, filename: string): Promise<void> => {
      try {
        // Convert data URI to blob for better memory management
        const response = await fetch(dataUri)
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)

        // Create and trigger download link
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()

        // Clean up immediately after click
        document.body.removeChild(link)
        URL.revokeObjectURL(objectUrl)
      } catch (error) {
        console.error('Error creating download link:', error)
        throw new Error('Failed to create download link')
      }
    },
    []
  )

  const showSuccessToast = useCallback(
    (format: DownloadFormat) => {
      toast({
        title: 'Download started',
        description: `Your ${format.toUpperCase()} file is being downloaded`,
        type: 'success',
        duration: 3000,
      })
    },
    [toast]
  )

  const showErrorToast = useCallback(
    (format: DownloadFormat, error: string) => {
      toast({
        title: 'Download failed',
        description: error,
        type: 'error',
        duration: 7000,
      })
    },
    [toast]
  )

  const trackDownload = useCallback(
    (downloadType: DownloadType, format: DownloadFormat) => {
      analytics.trackDownload(downloadType, format)
    },
    []
  )

  const trackError = useCallback(
    (downloadType: DownloadType, format: DownloadFormat, error: string) => {
      analytics.trackError(
        `download_${format}_failed`,
        `${downloadType}: ${error}`
      )
    },
    []
  )

  const validateContent = useCallback(
    (content: string): boolean => {
      if (!content || !content.trim()) {
        const error = 'No content available to download'
        updateState({ error })
        showErrorToast('pdf', error)
        return false
      }
      return true
    },
    [updateState, showErrorToast]
  )

  const download = useCallback(
    async (options: DownloadOptions): Promise<void> => {
      const {
        content,
        title,
        format,
        outputType,
        downloadType = outputType || 'combined',
      } = options

      // Validate inputs
      if (!validateContent(content)) {
        return
      }

      if (!title?.trim()) {
        const error = 'No title provided for download'
        updateState({ error })
        showErrorToast(format, error)
        return
      }

      // Reset state and start download
      updateState({
        isDownloading: true,
        error: null,
        progress: 0,
      })

      try {
        // Track download attempt
        trackDownload(downloadType, format)

        // Update progress
        updateState({ progress: 25 })

        // Generate file using unified document generator
        let dataUri: string
        try {
          // Import the unified document generator
          const { generateUnifiedDocument } = await import(
            '@/lib/document-generator'
          )
          dataUri = await generateUnifiedDocument(content, title, format)
        } catch (genError) {
          throw new Error(
            `Failed to generate ${format.toUpperCase()} file: ${
              genError instanceof Error ? genError.message : 'Unknown error'
            }`
          )
        }

        // Update progress
        updateState({ progress: 75 })

        // Generate filename and create download
        const filename = generateFilename(title, format)
        await createDownloadLink(dataUri, filename)

        // Update progress to complete
        updateState({ progress: 100 })

        // Show success feedback
        showSuccessToast(format)

        // Reset state after short delay
        setTimeout(() => {
          resetState()
        }, 1000)
      } catch (error) {
        console.error(`Error downloading ${format}:`, error)

        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to generate ${format.toUpperCase()} file. Please try again.`

        // Track error
        trackError(downloadType, format, errorMessage)

        // Update state with error
        updateState({
          isDownloading: false,
          error: errorMessage,
          progress: undefined,
        })

        // Show error feedback
        showErrorToast(format, errorMessage)
      }
    },
    [
      validateContent,
      updateState,
      trackDownload,
      trackError,
      generateFilename,
      createDownloadLink,
      showSuccessToast,
      showErrorToast,
      resetState,
    ]
  )

  const downloadPDF = useCallback(
    (content: string, title: string, outputType?: OutputType) => {
      return download({ content, title, format: 'pdf', outputType })
    },
    [download]
  )

  const downloadDOCX = useCallback(
    (content: string, title: string, outputType?: OutputType) => {
      return download({ content, title, format: 'docx', outputType })
    },
    [download]
  )

  const downloadCombined = useCallback(
    async (
      mediumSummary: string,
      howToGuide: string,
      title?: string
    ): Promise<void> => {
      // Validate content
      if (!mediumSummary && !howToGuide) {
        const error =
          'No content available to download. Please generate content first.'
        updateState({ error })
        showErrorToast('docx', error)
        return
      }

      // Create combined content
      let combinedContent = ''

      // Add medium summary if available
      if (mediumSummary) {
        combinedContent += mediumSummary
      }

      // Add page break and how-to guide if available
      if (howToGuide) {
        // Add a page break between sections
        combinedContent += '<div style="page-break-before: always;"></div>'

        // If the how-to guide doesn't start with a heading, add one
        if (!howToGuide.includes('<h1>')) {
          combinedContent += '<h1>How-to Guide</h1>'
        }

        combinedContent += howToGuide
      }

      // Generate title with current date
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      const documentTitle = title || `Research Summary - ${currentDate}`

      // Download the combined document
      return download({
        content: combinedContent,
        title: documentTitle,
        format: 'docx',
        downloadType: 'combined',
      })
    },
    [download, updateState, showErrorToast]
  )

  return {
    // State
    isDownloading: state.isDownloading,
    progress: state.progress,
    error: state.error,

    // Actions
    download,
    downloadPDF,
    downloadDOCX,
    downloadCombined,
    resetState,
  }
}
