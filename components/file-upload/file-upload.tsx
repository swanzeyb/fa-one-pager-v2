'use client'

import React from 'react'
import { Upload, FileText, FileType, Trash2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCoreStore } from '@/stores/core-store'
import { useUIStore } from '@/stores/ui-store'
import { useToast } from '@/hooks/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useStepTracker } from '@/hooks/use-step-tracker'

interface FileUploadProps {
  children: React.ReactNode
}

export function FileUpload({ children }: FileUploadProps) {
  const { currentStep } = useStepTracker()
  const isCurrentStep = currentStep === 1

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span
            className={`text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center ${
              isCurrentStep
                ? 'bg-blue-500 text-white'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            1
          </span>
          Upload Files
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-4rem)]">
        {children}
      </CardContent>
    </Card>
  )
}

export function FileDropzone() {
  const addFiles = useCoreStore((state) => state.addFiles)
  const setToast = useCoreStore((state) => state.setToast)
  const isDragOverActive = useUIStore((s) => s.isDragOverActive)
  const setDragOverActive = useUIStore((s) => s.setDragOverActive)
  const { currentStep } = useStepTracker()
  const isCurrentStep = currentStep === 1

  // Call useToast at the top level of the component
  const { toast } = useToast()

  // Set up toast function for the store
  React.useEffect(() => {
    setToast(toast)
  }, [setToast, toast])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverActive(true)
  }

  const handleDragLeave = () => {
    setDragOverActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverActive(false)

    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files)
      addFiles(newFiles)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      addFiles(newFiles)
      // Reset the input value to allow selecting the same file again
      e.target.value = ''
    }
  }

  return (
    <>
      <div
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center h-64 mb-4 transition-colors ${
          isDragOverActive
            ? 'border-primary bg-primary/10'
            : 'border-muted-foreground/25'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground text-center mb-2">
          Drag and drop files here or click to browse
        </p>
        <p className="text-xs text-muted-foreground text-center mb-4">
          Supported file types
        </p>
        <input
          type="file"
          id="file-upload"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.txt,application/pdf,text/plain"
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          className={
            isCurrentStep
              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700'
              : ''
          }
        >
          <span
            className={`mr-2 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center ${
              isCurrentStep
                ? 'bg-blue-500 text-white'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            1
          </span>
          Select Files
        </Button>
      </div>

      {/* File Limits Information */}
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1 text-xs">
            <div className="font-medium">File Limits:</div>
            <div>• Max 10 files</div>
            <div>• Max 15 MB of files</div>
            <div className="mt-2">
              <span className="font-medium">Supported formats:</span> PDF, TXT
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </>
  )
}

export function FileList() {
  const files = useCoreStore((state) => state.files)
  const removeFile = useCoreStore((state) => state.removeFile)

  return (
    <>
      <h3 className="text-sm font-medium mb-2">Uploaded Files</h3>
      <div className="flex-grow mb-8 overflow-y-auto max-h-64">
        <div className="space-y-2">
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No files uploaded yet
            </p>
          ) : (
            files.map((file: File, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm p-3 bg-muted rounded-md group hover:bg-muted/80"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center min-w-0 flex-1">
                        {file.type === 'application/pdf' ? (
                          <FileText className="h-4 w-4 flex-shrink-0 mr-2 text-red-500" />
                        ) : (
                          <FileType className="h-4 w-4 flex-shrink-0 mr-2 text-blue-500" />
                        )}
                        <span className="truncate">{file.name}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-[300px] break-words"
                    >
                      {file.name}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="flex items-center gap-1 flex-shrink-0 ml-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  {/* <span>Remove</span> */}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
