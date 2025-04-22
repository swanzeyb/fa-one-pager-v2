"use client"

import { useState } from "react"
import { Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { generatePDF, generateDOCX, refreshOutput, type OutputType, type FileAttachment } from "@/app/actions"
import { useImageUpload } from "./image-upload-context"

interface OutputActionsProps {
  content: string
  title: string
  outputType: OutputType
  fileAttachments: FileAttachment[]
  onRefresh: (newContent: string) => void
  disabled?: boolean
}

export function OutputActions({
  content,
  title,
  outputType,
  fileAttachments,
  onRefresh,
  disabled = false,
}: OutputActionsProps) {
  const { getAllImages } = useImageUpload()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleDownload = async (format: "pdf" | "docx") => {
    if (!content) return

    setIsGenerating(true)
    try {
      let dataUri: string
      let filename: string
      const images = getAllImages()

      if (format === "pdf") {
        dataUri = await generatePDF(content, title, images)
        filename = `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`
      } else {
        dataUri = await generateDOCX(content, title, images)
        filename = `${title.toLowerCase().replace(/\s+/g, "-")}.docx`
      }

      // Create a link element and trigger download
      const link = document.createElement("a")
      link.href = dataUri
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error(`Error generating ${format}:`, error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRefresh = async () => {
    if (fileAttachments.length === 0) return

    setIsRefreshing(true)
    try {
      const newContent = await refreshOutput(fileAttachments, outputType)
      onRefresh(newContent)
    } catch (error) {
      console.error("Error refreshing content:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        disabled={disabled || isRefreshing || fileAttachments.length === 0}
        onClick={handleRefresh}
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        <span className="sr-only">Refresh</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={disabled || isGenerating || !content}
          >
            <Download className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Download"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleDownload("pdf")}>Download as PDF</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload("docx")}>Download as Word Document</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
