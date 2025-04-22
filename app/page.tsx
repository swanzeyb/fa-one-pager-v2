"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { processFiles } from "./actions"
import { DownloadButton } from "@/components/download-button"

export default function FileUploadInterface() {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [outputs, setOutputs] = useState({
    shortSummary: "",
    mediumSummary: "",
    howToGuide: "",
  })

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
  }

  const processUploadedFiles = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    try {
      const fileContents = await Promise.all(files.map((file) => file.text()))
      const results = await processFiles(fileContents)
      setOutputs(results)
    } catch (error) {
      console.error("Error processing files:", error)
      // You might want to show an error message to the user here
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen lg:flex-row">
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
            <Button onClick={processUploadedFiles} disabled={files.length === 0 || isProcessing}>
              {isProcessing ? "Processing..." : "Process Files"}
            </Button>
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
            <Tabs defaultValue="short-summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="short-summary">Short Summary</TabsTrigger>
                <TabsTrigger value="medium-summary">Medium Summary</TabsTrigger>
                <TabsTrigger value="how-to-guide">How-to Guide</TabsTrigger>
              </TabsList>
              <TabsContent value="short-summary" className="mt-4">
                <div className="p-4 border rounded-md">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium">Short Summary</h3>
                    <DownloadButton
                      content={outputs.shortSummary}
                      title="Short Summary"
                      disabled={!outputs.shortSummary}
                    />
                  </div>
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    {outputs.shortSummary ? (
                      <p className="text-sm">{outputs.shortSummary}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Upload and process files to see the short summary.
                      </p>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>
              <TabsContent value="medium-summary" className="mt-4">
                <div className="p-4 border rounded-md">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium">Medium Summary</h3>
                    <DownloadButton
                      content={outputs.mediumSummary}
                      title="Medium Summary"
                      disabled={!outputs.mediumSummary}
                    />
                  </div>
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    {outputs.mediumSummary ? (
                      <p className="text-sm">{outputs.mediumSummary}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Upload and process files to see the medium summary.
                      </p>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>
              <TabsContent value="how-to-guide" className="mt-4">
                <div className="p-4 border rounded-md">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium">How-to Guide</h3>
                    <DownloadButton content={outputs.howToGuide} title="How-to Guide" disabled={!outputs.howToGuide} />
                  </div>
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    {outputs.howToGuide ? (
                      <p className="text-sm">{outputs.howToGuide}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Upload and process files to see the how-to guide.</p>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
