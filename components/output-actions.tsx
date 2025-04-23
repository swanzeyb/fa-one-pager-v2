"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { generatePDF, generateDOCX, type OutputType, type FileAttachment } from "@/app/actions"
import { useImageUpload } from "./image-upload-context"
import { Spinner } from "./spinner"
import { useToast } from "@/hooks/use-toast"
import { useOutput } from "./output/output-context"

interface OutputActionsProps {
  content: string
  title: string
  outputType: OutputType
  fileAttachments: FileAttachment[]
  disabled?: boolean
}

export function OutputActions({ content, title, outputType, fileAttachments, disabled = false }: OutputActionsProps) {
  const { getAllImages } = useImageUpload()
  const { toast } = useToast()
  const { getOutputContent } = useOutput()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async (format: "pdf" | "docx") => {
    // Get the potentially edited content
    const currentContent = getOutputContent(outputType)
    if (!currentContent) return

    setIsGenerating(true)
    try {
      let dataUri: string
      let filename: string
      const images = getAllImages()

      if (format === "pdf") {
        dataUri = await generatePDF(currentContent, title)
        filename = `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`
      } else {
        dataUri = await generateDOCX(currentContent, title)
        filename = `${title.toLowerCase().replace(/\s+/g, "-")}.docx`
      }

      // Create a link element and trigger download
      const link = document.createElement("a")
      link.href = dataUri
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download started",
        description: `Your ${format.toUpperCase()} file is being downloaded`,
        type: "success",
        duration: 3000, // Short duration for success messages
      })
    } catch (error) {
      console.error(`Error generating ${format}:`, error)
      toast({
        title: "Download failed",
        description:
          error instanceof Error ? error.message : `Failed to generate ${format.toUpperCase()} file. Please try again.`,
        type: "error",
        duration: 7000, // Longer duration for error messages
      })
    } finally {
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
        <DropdownMenuItem onClick={() => handleDownload("pdf")}>Download as PDF</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload("docx")}>Download as Word Document</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
