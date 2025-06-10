'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/spinner'
import { useDownload, type DownloadFormat } from '@/hooks/use-download'
import { type OutputType } from '@/app/actions'

export interface UnifiedDownloadButtonProps {
  content: string
  title: string
  outputType?: OutputType
  disabled?: boolean
  variant?:
    | 'outline'
    | 'default'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showProgress?: boolean
}

export function UnifiedDownloadButton({
  content,
  title,
  outputType,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  className = '',
  showProgress = false,
}: UnifiedDownloadButtonProps) {
  const { isDownloading, progress, download } = useDownload()

  const handleDownload = async (format: DownloadFormat) => {
    await download({
      content,
      title,
      format,
      outputType,
    })
  }

  const isDisabled = disabled || isDownloading || !content?.trim()

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={`flex items-center gap-2 ${className}`}
            disabled={isDisabled}
          >
            {isDownloading ? (
              <>
                <Spinner className="h-4 w-4" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleDownload('pdf')}
            disabled={isDisabled}
          >
            Download as PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleDownload('docx')}
            disabled={isDisabled}
          >
            Download as Word Document
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showProgress && isDownloading && progress !== undefined && (
        <div className="w-full">
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  )
}

export interface CombinedDownloadButtonProps {
  mediumSummary: string
  howToGuide: string
  title?: string
  disabled?: boolean
  variant?:
    | 'outline'
    | 'default'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showProgress?: boolean
}

export function CombinedDownloadButton({
  mediumSummary,
  howToGuide,
  title,
  disabled = false,
  variant = 'outline',
  size = 'lg',
  className = '',
  showProgress = true,
}: CombinedDownloadButtonProps) {
  const { isDownloading, progress, downloadCombined } = useDownload()

  const handleCombinedDownload = async () => {
    await downloadCombined(mediumSummary, howToGuide, title)
  }

  const hasContent = Boolean(mediumSummary?.trim() || howToGuide?.trim())
  const isDisabled = disabled || isDownloading || !hasContent

  return (
    <div className="space-y-2">
      <Button
        variant={variant}
        size={size}
        onClick={handleCombinedDownload}
        disabled={isDisabled}
        className={`flex items-center justify-center gap-2 ${className}`}
      >
        {isDownloading ? (
          <>
            <Spinner className="h-5 w-5" />
            Downloading...
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            Download Word
          </>
        )}
      </Button>

      {showProgress && isDownloading && progress !== undefined && (
        <div className="w-full">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center mt-1">
            {progress}% complete
          </p>
        </div>
      )}
    </div>
  )
}
