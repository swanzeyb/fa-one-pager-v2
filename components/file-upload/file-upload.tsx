"use client"

import type React from "react"
import { Upload, X, FileText, FileType } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFileUpload } from "./file-upload-context"

interface FileUploadProps {
  children: React.ReactNode
}

export function FileUpload({ children }: FileUploadProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>File Upload</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-4rem)]">{children}</CardContent>
    </Card>
  )
}

export function FileUploadArea() {
  const { isDragging, setIsDragging, addFiles } = useFileUpload()

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
      addFiles(newFiles)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      addFiles(newFiles)
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center h-64 mb-4 transition-colors ${
        isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground text-center mb-2">Drag and drop files here or click to browse</p>
      <p className="text-xs text-muted-foreground text-center mb-4">Supported file types</p>
      <div className="flex gap-2 mb-2">
        <div className="flex items-center text-xs bg-slate-100 px-2 py-1 rounded">
          <FileText className="h-3 w-3 mr-1" />
          PDF
        </div>
        <div className="flex items-center text-xs bg-slate-100 px-2 py-1 rounded">
          <FileType className="h-3 w-3 mr-1" />
          TXT
        </div>
      </div>
      <input
        type="file"
        id="file-upload"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.txt,application/pdf,text/plain"
      />
      <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
        Select Files
      </Button>
    </div>
  )
}

export function FileList() {
  const { files, removeFile } = useFileUpload()

  return (
    <>
      <h3 className="text-sm font-medium mb-2">Uploaded Files</h3>
      <ScrollArea className="flex-grow mb-8">
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No files uploaded yet</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                <div className="flex items-center truncate max-w-[80%]">
                  {file.type === "application/pdf" ? (
                    <FileText className="h-4 w-4 mr-2 text-red-500" />
                  ) : (
                    <FileType className="h-4 w-4 mr-2 text-blue-500" />
                  )}
                  <span className="truncate">{file.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </>
  )
}
