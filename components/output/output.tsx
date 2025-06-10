'use client'

import { AlertCircle, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/spinner'
import { OutputActions } from '@/components/output-actions'
import { OutputProvider, useOutput } from './output-context'
import { useFileUpload } from '../file-upload/file-upload-context'
import {
  SimpleEditor,
  Toolbar,
  EditorContent,
  useSimpleEditor,
} from '../simple-editor'
import { CombinedDownloadButton } from '@/components/unified-download-button'
import type { OutputType, FileAttachment } from '@/app/actions'
import type React from 'react'
import { useState, useRef } from 'react'
import { generateDOCX } from '@/app/actions'
import { useToast } from '@/hooks/use-toast'
import { analytics } from '@/lib/posthog'

interface OutputProps {
  children: React.ReactNode
}

export function Output({ children }: OutputProps) {
  return (
    <OutputProvider>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Output</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-6">
          {children}
        </CardContent>
      </Card>
    </OutputProvider>
  )
}

interface EditorWithActionsProps {
  outputType: OutputType
  title: string
  fileAttachments: FileAttachment[]
  disabled?: boolean
}

// Create a wrapper component to access the editor context
function EditorWithActions({
  outputType,
  title,
  fileAttachments,
  disabled = false,
}: EditorWithActionsProps) {
  const { htmlContent } = useSimpleEditor()

  return (
    <OutputActions
      content={htmlContent}
      title={title}
      outputType={outputType}
      fileAttachments={fileAttachments}
      disabled={disabled}
    />
  )
}

export function OutputContent() {
  const {
    outputs,
    errors,
    isProcessing,
    processMultipleOutputs,
    processOutputType,
  } = useOutput()
  const { files, fileAttachments, prepareFileAttachments } = useFileUpload()
  const [editorContent, setEditorContent] = useState('')
  const { toast } = useToast()
  const editorRef = useRef(null)

  const handleGenerate = async () => {
    const attachments = await prepareFileAttachments()

    // Check if we have any existing successful outputs
    const hasSuccessfulMedium = outputs.mediumSummary && !errors.mediumSummary
    const hasSuccessfulHowTo = outputs.howToGuide && !errors.howToGuide

    // If we have some successful outputs, offer to only generate failed ones
    if (hasSuccessfulMedium || hasSuccessfulHowTo) {
      const failedOutputs = []
      if (!hasSuccessfulMedium) failedOutputs.push('mediumSummary')
      if (!hasSuccessfulHowTo) failedOutputs.push('howToGuide')

      if (failedOutputs.length > 0) {
        // Only process failed outputs to avoid unnecessary API calls
        for (const outputType of failedOutputs) {
          await processOutputType(outputType as OutputType, attachments, false)
        }
        return
      }
    }

    // If no successful outputs exist, or all are successful (regenerate all), use bulk processing
    processMultipleOutputs(attachments)
  }

  const handleRegenerate = async (outputType: OutputType) => {
    const attachments = await prepareFileAttachments()
    processOutputType(outputType, attachments, true) // true indicates this is a regeneration
  }

  const handleRetryFailed = async (outputType: OutputType) => {
    const attachments = await prepareFileAttachments()
    processOutputType(outputType, attachments, false) // false indicates this is a retry, not regeneration
  }

  const handleEditorChange = (content: string, outputType: OutputType) => {
    if (outputType === 'mediumSummary') {
      setEditorContent(content)
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
            onClick={() => handleRetryFailed(outputType)}
            disabled={isProcessing[outputType]}
          >
            {isProcessing[outputType] ? (
              <>
                <Spinner className="h-4 w-4 mr-1" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry{' '}
                {outputType === 'howToGuide'
                  ? 'How-to Guide'
                  : 'Medium Summary'}
              </>
            )}
          </Button>
        </div>
      )
    }

    if (outputs[outputType]) {
      return (
        <div className="flex flex-col h-full">
          <SimpleEditor
            content={outputs[outputType]}
            onChange={(content) => handleEditorChange(content, outputType)}
            ref={editorRef}
          >
            <Toolbar />
            <EditorContent />
          </SimpleEditor>

          {/* Add regenerate button at the bottom of the content */}
          <div className="p-3 border-t bg-gray-50 flex justify-end">
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
              {outputType === 'howToGuide' ? 'How-to Guide' : 'Medium Summary'}
            </Button>
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
  const hasContent = outputs.mediumSummary || outputs.howToGuide
  const hasSuccessfulMedium = outputs.mediumSummary && !errors.mediumSummary
  const hasSuccessfulHowTo = outputs.howToGuide && !errors.howToGuide
  const hasFailedOutputs = errors.mediumSummary || errors.howToGuide

  const getGenerateButtonText = () => {
    if (isGenerating) return 'Generating Content...'

    if (hasSuccessfulMedium && hasSuccessfulHowTo) {
      return 'Regenerate All Content'
    } else if (hasSuccessfulMedium || hasSuccessfulHowTo) {
      return 'Generate Missing Content'
    } else {
      return 'Generate Content'
    }
  }

  return (
    <div className="space-y-8">
      {/* Generate and Download Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || files.length === 0}
          className="w-full py-6 text-lg"
        >
          {isGenerating ? (
            <>
              <Spinner className="h-5 w-5 mr-2" />
              {getGenerateButtonText()}
            </>
          ) : (
            <>{getGenerateButtonText()}</>
          )}
        </Button>

        <CombinedDownloadButton
          mediumSummary={outputs.mediumSummary}
          howToGuide={outputs.howToGuide}
          disabled={isGenerating}
          className="w-full py-6 text-lg"
          showProgress={true}
        />
      </div>

      {/* Medium Summary Section */}
      <div className="border rounded-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium flex items-center">
            Medium Summary
            {outputs.mediumSummary && !errors.mediumSummary && (
              <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
            )}
            {errors.mediumSummary && (
              <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
            {isProcessing.mediumSummary && <Spinner className="ml-2 h-4 w-4" />}
          </h3>
        </div>
        <div className="flex-grow">{renderOutputSection('mediumSummary')}</div>
      </div>

      {/* How-to Guide Section */}
      <div className="border rounded-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium flex items-center">
            How-to Guide
            {outputs.howToGuide && !errors.howToGuide && (
              <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
            )}
            {errors.howToGuide && (
              <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
            {isProcessing.howToGuide && <Spinner className="ml-2 h-4 w-4" />}
          </h3>
        </div>
        <div className="flex-grow">{renderOutputSection('howToGuide')}</div>
      </div>
    </div>
  )
}
