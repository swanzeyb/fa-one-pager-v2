"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { generatePDF, generateDOCX } from "@/app/actions"

interface DownloadButtonProps {
  content: string
  title: string
  disabled?: boolean
}

export function DownloadButton({ content, title, disabled = false }: DownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async (format: "pdf" | "docx") => {
    if (!content) return

    setIsGenerating(true)
    try {
      let dataUri: string
      let filename: string

      if (format === "pdf") {
        dataUri = await generatePDF(content, title)
        filename = `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`
      } else {
        dataUri = await generateDOCX(content, title)
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

  return (
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
  )
}
