'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  generatePDF,
  generateDOCX,
  type OutputType,
  type FileAttachment,
} from '@/app/actions'
import { useImageUpload } from './image-upload-context'
import { Spinner } from './spinner'
import { useToast } from '@/hooks/use-toast'
import { useOutput } from './output/output-context'
import { analytics } from '@/lib/posthog'

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
  const { getAllImages } = useImageUpload()
  const { toast } = useToast()
  const { getOutputContent } = useOutput()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async (format: 'pdf' | 'docx') => {
    // Use the HTML content passed directly, or fall back to the output context
    const currentContent = content || getOutputContent(outputType)
    if (!currentContent) return

    // Track download in PostHog
    analytics.trackDownload(outputType, format)

    setIsGenerating(true)
    let objectUrl: string | null = null
    let link: HTMLAnchorElement | null = null

    try {
      let dataUri: string
      let filename: string
      const images = getAllImages()

      if (format === 'pdf') {
        dataUri = await generatePDF(currentContent, title)
        filename = `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`
      } else {
        dataUri = await generateDOCX(currentContent, title)
        filename = `${title.toLowerCase().replace(/\s+/g, '-')}.docx`
      }

      // Convert data URI to blob for better memory management
      const response = await fetch(dataUri)
      const blob = await response.blob()
      objectUrl = URL.createObjectURL(blob)

      // Create a link element and trigger download
      link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()

      toast({
        title: 'Download started',
        description: `Your ${format.toUpperCase()} file is being downloaded`,
        type: 'success',
        duration: 3000, // Short duration for success messages
      })
    } catch (error) {
      console.error(`Error generating ${format}:`, error)

      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to generate ${format.toUpperCase()} file. Please try again.`

      // Track error in PostHog
      analytics.trackError(`download_${format}_failed`, errorMessage)

      toast({
        title: 'Download failed',
        description: errorMessage,
        type: 'error',
        duration: 7000, // Longer duration for error messages
      })
    } finally {
      // Clean up resources in finally block to prevent memory leaks
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
      if (link && link.parentNode) {
        document.body.removeChild(link)
      }
      setIsGenerating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          disabled={disabled || isGenerating || !content}
        >
          {isGenerating ? (
            <>
              <Spinner className="h-4 w-4 mr-1" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1" />
              Download
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleDownload('pdf')}>
          Download as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('docx')}>
          Download as Word Document
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
