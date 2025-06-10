'use client'

import { type OutputType, type FileAttachment } from '@/app/actions'
import { useOutput } from './output/output-context'
import { UnifiedDownloadButton } from './unified-download-button'

interface OutputActionsProps {
  content: string
  title: string
  outputType: OutputType
  fileAttachments: FileAttachment[]
  disabled?: boolean
}

export function OutputActions({
  content,
  title,
  outputType,
  fileAttachments,
  disabled = false,
}: OutputActionsProps) {
  const { getOutputContent } = useOutput()

  // Use the HTML content passed directly, or fall back to the output context
  const currentContent = content || getOutputContent(outputType)

  return (
    <UnifiedDownloadButton
      content={currentContent}
      title={title}
      outputType={outputType}
      disabled={disabled}
      variant="outline"
      size="sm"
      className="flex items-center gap-1"
    />
  )
}
