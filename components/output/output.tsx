"use client"

import { AlertCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/spinner"
import { OutputActions } from "@/components/output-actions"
import { OutputProvider, useOutput } from "./output-context"
import { useFileUpload } from "../file-upload/file-upload-context"
import { SimpleEditor, Toolbar, EditorContent, useSimpleEditor } from "../simple-editor"
import type { OutputType } from "@/app/actions"
import type React from "react"
import { useState, useRef } from "react"
import { generateDOCX } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { analytics } from "@/lib/posthog"

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
        <CardContent className="flex flex-col space-y-6">{children}</CardContent>
      </Card>
    </OutputProvider>
  )
}

// Create a wrapper component to access the editor context
function EditorWithActions({ outputType, title, fileAttachments, disabled = false }) {
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
  const { outputs, errors, isProcessing, processMultipleOutputs } = useOutput()
  const { files, fileAttachments, prepareFileAttachments } = useFileUpload()
  const [editorContent, setEditorContent] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()
  const editorRef = useRef(null)

  const handleGenerate = async () => {
    const attachments = await prepareFileAttachments()
    processMultipleOutputs(attachments)
  }

  const handleEditorChange = (content: string, outputType: OutputType) => {
    if (outputType === "mediumSummary") {
      setEditorContent(content)
    }
  }

  const handleCombinedDownload = async () => {
    // Check if we have content to download
    if (!outputs.mediumSummary && !outputs.howToGuide) {
      toast({
        title: "No content to download",
        description: "Please generate content first before downloading",
        type: "warning",
        duration: 3000,
      })
      return
    }

    setIsDownloading(true)
    try {
      // Track download in PostHog
      analytics.trackDownload("combined", "docx")

      // Combine the content
      const combinedContent = `
        ${outputs.mediumSummary || ""}
        <h1>How-to Guide</h1>
        ${outputs.howToGuide || ""}
      `

      // Generate the DOCX
      const dataUri = await generateDOCX(combinedContent, "Combined Document")
      const filename = "combined-document.docx"

      // Create a link element and trigger download
      const link = document.createElement("a")
      link.href = dataUri
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download started",
        description: "Your combined document is being downloaded",
        type: "success",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error generating combined document:", error)

      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate combined document. Please try again."

      // Track error in PostHog
      analytics.trackError("download_combined_failed", errorMessage)

      toast({
        title: "Download failed",
        description: errorMessage,
        type: "error",
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
        </div>
      )
    }

    if (outputs[outputType]) {
      return (
        <SimpleEditor
          content={outputs[outputType]}
          onChange={(content) => handleEditorChange(content, outputType)}
          ref={editorRef}
        >
          <Toolbar />
          <EditorContent />
        </SimpleEditor>
      )
    }

    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {isProcessing[outputType]
          ? `Generating ${outputType === "howToGuide" ? "how-to guide" : "medium summary"}...`
          : `Click the Generate button to create content.`}
      </p>
    )
  }

  const isGenerating = isProcessing.mediumSummary || isProcessing.howToGuide
  const hasContent = outputs.mediumSummary || outputs.howToGuide

  return (
    <div className="space-y-8">
      {/* Generate and Download Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || files.length === 0}
          className="w-full sm:w-2/3 py-6 text-lg"
        >
          {isGenerating ? (
            <>
              <Spinner className="h-5 w-5 mr-2" />
              Generating Content...
            </>
          ) : (
            <>Generate Content</>
          )}
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={handleCombinedDownload}
          disabled={isDownloading || !hasContent}
          className="w-full sm:w-1/3 py-6 text-lg flex items-center justify-center"
        >
          {isDownloading ? (
            <>
              <Spinner className="h-5 w-5 mr-2" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-5 w-5 mr-2" />
              Download Word
            </>
          )}
        </Button>
      </div>

      {/* Medium Summary Section */}
      <div className="border rounded-md">
        <div className="p-4 flex justify-between items-center border-b">
          <h3 className="text-lg font-medium">Medium Summary</h3>
        </div>
        <div className="flex-grow">{renderOutputSection("mediumSummary")}</div>
      </div>

      {/* How-to Guide Section */}
      <div className="border rounded-md">
        <div className="p-4 flex justify-between items-center border-b">
          <h3 className="text-lg font-medium">How-to Guide</h3>
        </div>
        <div className="flex-grow">{renderOutputSection("howToGuide")}</div>
      </div>
    </div>
  )
}
