"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { processOutput, type OutputType, type FileAttachment } from "./actions"
import { OutputActions } from "@/components/output-actions"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { ImageUploadProvider } from "@/components/image-upload-context"
import { Spinner } from "@/components/spinner"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

export default function FileUploadInterface() {
  const { toast } = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [fileAttachments, setFileAttachments] = useState<FileAttachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState<Record<OutputType, boolean>>({
    shortSummary: false,
    mediumSummary: false,
    howToGuide: false,
  })
  const [outputs, setOutputs] = useState({
    shortSummary: "",
    mediumSummary: "",
    howToGuide: "",
  })
  const [errors, setErrors] = useState<Record<OutputType, string | null>>({
    shortSummary: null,
    mediumSummary: null,
    howToGuide: null,
  })
  const [activeTab, setActiveTab] = useState<OutputType>("shortSummary")

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setFileAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  // Helper function to convert a file to a data URL
  const convertToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
      reader.readAsDataURL(file)
    })
  }

  const prepareFileAttachments = async () => {
    try {
      const attachments = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          contentType: file.type,
          data: await convertToDataURL(file),
        })),
      )
      setFileAttachments(attachments)
      return attachments
    } catch (error) {
      toast({
        title: "Error preparing files",
        description: error instanceof Error ? error.message : "Failed to prepare files for processing",
        type: "error",
        duration: 5000,
      })
      throw error
    }
  }

  const processOutputType = async (outputType: OutputType) => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one file to process",
        type: "warning",
        duration: 3000,
      })
      return
    }

    // Clear any previous errors
    setErrors((prev) => ({ ...prev, [outputType]: null }))
    setIsProcessing((prev) => ({ ...prev, [outputType]: true }))

    try {
      const attachments = await prepareFileAttachments()
      const result = await processOutput(attachments, outputType)
      setOutputs((prev) => ({ ...prev, [outputType]: result }))

      toast({
        title: "Processing complete",
        description: `${getOutputTypeTitle(outputType)} has been generated successfully`,
        type: "success",
        duration: 3000, // Shorter duration for success messages
      })
    } catch (error) {
      console.error(`Error processing ${outputType}:`, error)

      // Set the error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to generate ${getOutputTypeTitle(outputType)}. Please try again.`

      setErrors((prev) => ({ ...prev, [outputType]: errorMessage }))

      toast({
        title: "Processing failed",
        description: errorMessage,
        type: "error",
        duration: 7000, // Longer duration for error messages
      })
    } finally {
      setIsProcessing((prev) => ({ ...prev, [outputType]: false }))
    }
  }

  const getOutputTypeTitle = (type: OutputType): string => {
    switch (type) {
      case "shortSummary":
        return "Short Summary"
      case "mediumSummary":
        return "Medium Summary"
      case "howToGuide":
        return "How-to Guide"
      default:
        return type
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as OutputType)
  }

  const renderContent = (outputType: OutputType) => {
    if (errors[outputType]) {
      return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
          <h3 className="text-lg font-medium text-red-500">Error</h3>
          <p className="text-sm text-muted-foreground">{errors[outputType]}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => processOutputType(outputType)}>
            Try Again
          </Button>
        </div>
      )
    }

    if (outputs[outputType]) {
      return <MarkdownRenderer content={outputs[outputType]} editable={true} />
    }

    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {isProcessing[outputType]
          ? `Generating ${outputType === "howToGuide" ? "how-to guide" : outputType}...`
          : `Click the Generate button to create a ${outputType === "howToGuide" ? "how-to guide" : outputType}.`}
      </p>
    )
  }

  return (
    <ImageUploadProvider>
      <div className="flex flex-col min-h-screen lg:flex-row bg-white">
        {/* Left Column - File Upload Area */}
        <div className="w-full lg:w-1/3 p-4 border-r">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-4rem)]">
              <div
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center h-64 mb-4 transition-colors ${
                  isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center mb-2">
                  Drag and drop files here or click to browse
                </p>
                <input type="file" id="file-upload" multiple className="hidden" onChange={handleFileChange} />
                <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                  Select Files
                </Button>
              </div>

              <h3 className="text-sm font-medium mb-2">Uploaded Files</h3>
              <ScrollArea className="flex-grow mb-4">
                {files.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No files uploaded yet</p>
                ) : (
                  <ul className="space-y-2">
                    {files.map((file, index) => (
                      <li key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                        <span className="truncate max-w-[80%]">{file.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)}>
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove file</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Output Windows with Tabs */}
        <div className="w-full lg:w-2/3 p-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Output</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="shortSummary" className="w-full" onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="shortSummary">
                    Short Summary
                    {isProcessing.shortSummary && <Spinner className="ml-2 h-4 w-4" />}
                  </TabsTrigger>
                  <TabsTrigger value="mediumSummary">
                    Medium Summary
                    {isProcessing.mediumSummary && <Spinner className="ml-2 h-4 w-4" />}
                  </TabsTrigger>
                  <TabsTrigger value="howToGuide">
                    How-to Guide
                    {isProcessing.howToGuide && <Spinner className="ml-2 h-4 w-4" />}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="shortSummary" className="mt-4">
                  <div className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium">Short Summary</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => processOutputType("shortSummary")}
                          disabled={isProcessing.shortSummary || files.length === 0}
                          className="flex items-center gap-1"
                        >
                          {isProcessing.shortSummary ? (
                            <>
                              <Spinner className="h-4 w-4" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4" />
                              Generate
                            </>
                          )}
                        </Button>
                        <OutputActions
                          content={outputs.shortSummary}
                          title="Short Summary"
                          outputType="shortSummary"
                          fileAttachments={fileAttachments}
                          disabled={!outputs.shortSummary || isProcessing.shortSummary || !!errors.shortSummary}
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-[calc(100vh-300px)]">{renderContent("shortSummary")}</ScrollArea>
                  </div>
                </TabsContent>
                <TabsContent value="mediumSummary" className="mt-4">
                  <div className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium">Medium Summary</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => processOutputType("mediumSummary")}
                          disabled={isProcessing.mediumSummary || files.length === 0}
                          className="flex items-center gap-1"
                        >
                          {isProcessing.mediumSummary ? (
                            <>
                              <Spinner className="h-4 w-4" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4" />
                              Generate
                            </>
                          )}
                        </Button>
                        <OutputActions
                          content={outputs.mediumSummary}
                          title="Medium Summary"
                          outputType="mediumSummary"
                          fileAttachments={fileAttachments}
                          disabled={!outputs.mediumSummary || isProcessing.mediumSummary || !!errors.mediumSummary}
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-[calc(100vh-300px)]">{renderContent("mediumSummary")}</ScrollArea>
                  </div>
                </TabsContent>
                <TabsContent value="howToGuide" className="mt-4">
                  <div className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium">How-to Guide</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => processOutputType("howToGuide")}
                          disabled={isProcessing.howToGuide || files.length === 0}
                          className="flex items-center gap-1"
                        >
                          {isProcessing.howToGuide ? (
                            <>
                              <Spinner className="h-4 w-4" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4" />
                              Generate
                            </>
                          )}
                        </Button>
                        <OutputActions
                          content={outputs.howToGuide}
                          title="How-to Guide"
                          outputType="howToGuide"
                          fileAttachments={fileAttachments}
                          disabled={!outputs.howToGuide || isProcessing.howToGuide || !!errors.howToGuide}
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-[calc(100vh-300px)]">{renderContent("howToGuide")}</ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </ImageUploadProvider>
  )
}
