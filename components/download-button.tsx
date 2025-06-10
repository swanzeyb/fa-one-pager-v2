'use client'

import { UnifiedDownloadButton } from './unified-download-button'

interface DownloadButtonProps {
  content: string
  title: string
  disabled?: boolean
}

export function DownloadButton({
  content,
  title,
  disabled = false,
}: DownloadButtonProps) {
  return (
    <UnifiedDownloadButton
      content={content}
      title={title}
      disabled={disabled}
      variant="outline"
      size="sm"
      className="flex items-center gap-1"
    />
  )
}
