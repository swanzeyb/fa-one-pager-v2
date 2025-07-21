'use client'

import { AlertCircle, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/spinner'

import { useCoreStore } from '@/stores/core-store'
import { WysiwygEditor } from '../wysiwyg-editor'
import type { OutputType } from '@/app/actions'
import React, { useState } from 'react'
import { generateDOCX } from '@/app/actions'
import { useToast } from '@/hooks/use-toast'
import { analytics } from '@/lib/posthog'
import { WebReviewForm } from '@/components/web-review-form'
import { useStepTracker } from '@/hooks/use-step-tracker'

interface OutputProps {
  children: React.ReactNode
}

export function Output({ children }: OutputProps) {
  const { currentStep, isStepComplete } = useStepTracker()
  const isCurrentStep = currentStep === 2
  const isComplete = isStepComplete(2)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span
            className={`text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center ${
              isCurrentStep
                ? 'bg-blue-500 text-white'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            2
          </span>
          Output
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-6">{children}</CardContent>
    </Card>
  )
}

export function OutputContent() {
  const outputs = useCoreStore(state => state.outputs)
  const errors = useCoreStore(state => state.errors)
  const isProcessing = useCoreStore(state => state.isProcessing)
  const processMultipleOutputs = useCoreStore(state => state.processMultipleOutputs)
  const processOutputType = useCoreStore(state => state.processOutputType)
  const files = useCoreStore(state => state.files)
  const fileAttachments = useCoreStore(state => state.fileAttachments)
  const setToast = useCoreStore(state => state.setToast)
  const { currentStep, isStepComplete } = useStepTracker()
  const [editorContent, setEditorContent] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  // Set up toast function for the store
  React.useEffect(() => {
    setToast(toast)
  }, [setToast, toast])

  const handleGenerate = async () => {
    processMultipleOutputs()
  }

  const handleRegenerate = async (outputType: OutputType) => {
    processOutputType(outputType, true)
  }

  const handleEditorChange = (content: string, outputType: OutputType) => {
    if (outputType === 'mediumSummary') {
      setEditorContent(content)
    }
  }

  const handleCombinedDownload = async () => {
    // Check if we have content to download
    if (!outputs.mediumSummary && !outputs.howToGuide) {
      toast({
        title: 'No content to download',
        description: 'Please generate content first before downloading',
        type: 'warning',
        duration: 3000,
      })
      return
    }

    setIsDownloading(true)
    try {
      // Track download in PostHog
      analytics.trackDownload('combined', 'docx')

      // Get the current date for the document title
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      // Create a properly structured combined document
      let combinedContent = ''

      // Add medium summary if available
      if (outputs.mediumSummary) {
        combinedContent += outputs.mediumSummary
      }

      // Add a page break and how-to guide if available
      if (outputs.howToGuide) {
        // Add a page break between sections
        combinedContent += '<div style="page-break-before: always;"></div>'

        // If the how-to guide doesn't start with a heading, add one
        if (!outputs.howToGuide.includes('<h1>')) {
          combinedContent += '<h1>How-to Guide</h1>'
        }

        combinedContent += outputs.howToGuide
      }

      // Generate the DOCX with a proper title
      const documentTitle = `Research Summary - ${currentDate}`
      const dataUri = await generateDOCX(combinedContent, documentTitle)
      const filename = `research-summary-${currentDate
        .toLowerCase()
        .replace(/\s+/g, '-')}.docx`

      // Create a link element and trigger download
      const link = document.createElement('a')
      link.href = dataUri
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Download started',
        description: 'Your combined document is being downloaded',
        type: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Error generating combined document:', error)

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to generate combined document. Please try again.'

      // Track error in PostHog
      analytics.trackError('download_combined_failed', errorMessage)

      toast({
        title: 'Download failed',
        description: errorMessage,
        type: 'error',
        duration: 7000,
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const renderOutputSection = (outputType: OutputType) => {
    if (errors[outputType]) {
      return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
          <h3 className="text-lg font-medium text-red-500">Error</h3>
          <p className="text-sm text-muted-foreground">{errors[outputType]}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={async () => {
              processMultipleOutputs()
            }}
          >
            Try Again
          </Button>
        </div>
      )
    }

    if (outputs[outputType]) {
      return (
        <div className="flex flex-col h-full">
          <WysiwygEditor
            content={outputs[outputType]}
            onChange={(content: string) =>
              handleEditorChange(content, outputType)
            }
            className="flex-1"
            placeholder="Your content will appear here..."
          />

          {/* Remove the footer with send button from individual panels */}
          <div className="border-t bg-gray-50 p-3 flex justify-end">
            <div className="p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRegenerate(outputType)}
                disabled={isProcessing[outputType]}
                className="flex items-center gap-1"
              >
                {isProcessing[outputType] ? (
                  <Spinner className="h-4 w-4 mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Regenerate{' '}
                {outputType === 'howToGuide'
                  ? 'How-to Guide'
                  : 'Medium Summary'}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {isProcessing[outputType]
          ? `Generating ${
              outputType === 'howToGuide' ? 'how-to guide' : 'medium summary'
            }...`
          : `Click the Generate button to create content.`}
      </p>
    )
  }

  const isGenerating = isProcessing.mediumSummary || isProcessing.howToGuide
  const hasContent = outputs.mediumSummary && outputs.howToGuide

  const isStep2Current = currentStep === 2
  const isStep2Complete = isStepComplete(2)

  return (
    <div className="space-y-8">
      {/* Generate and Download Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || files.length === 0}
          className={`w-full sm:w-2/3 py-6 text-lg ${
            isStep2Current
              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700'
              : ''
          }`}
        >
          {isGenerating ? (
            <>
              <Spinner className="h-5 w-5 mr-2" />
              Generating Content...
            </>
          ) : (
            <>
              <span
                className={`mr-2 text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                  isStep2Current
                    ? 'bg-blue-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                2
              </span>
              Generate Content
            </>
          )}
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={handleCombinedDownload}
          disabled={isDownloading || !hasContent}
          className="w-full sm:w-1/3 py-6 text-lg"
        >
          {isDownloading ? (
            <>
              <Spinner className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="truncate">Downloading...</span>
            </>
          ) : (
            <>
              <Download className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="truncate">Download Word</span>
            </>
          )}
        </Button>
      </div>

      {/* Medium Summary Section */}
      <div className="border rounded-md">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Medium Summary</h3>
        </div>
        <div className="flex-grow">{renderOutputSection('mediumSummary')}</div>
      </div>

      {/* How-to Guide Section */}
      <div className="border rounded-md">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">How-to Guide</h3>
        </div>
        <div className="flex-grow">{renderOutputSection('howToGuide')}</div>
      </div>

      {/* Web Review Form - Only show if we have content */}
      {hasContent && <WebReviewForm className="mt-4" disabled={isGenerating} />}
    </div>
  )
}
