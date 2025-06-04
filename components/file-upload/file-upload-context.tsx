"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import type { FileAttachment } from "@/app/actions"
import { analytics } from "@/lib/posthog"

interface FileUploadContextType {
  files: File[]
  fileAttachments: FileAttachment[]
  isDragging: boolean
  addFiles: (newFiles: File[]) => void
  removeFile: (index: number) => void
  setIsDragging: (isDragging: boolean) => void
  prepareFileAttachments: () => Promise<FileAttachment[]>
}

const FileUploadContext = createContext<FileUploadContextType | undefined>(undefined)

export function useFileUpload() {
  const context = useContext(FileUploadContext)
  if (context === undefined) {
    throw new Error("useFileUpload must be used within a FileUploadProvider")
  }
  return context
}

interface FileUploadProviderProps {
  children: ReactNode
}

// Define allowed file types
const ALLOWED_FILE_TYPES = [
  "application/pdf", // PDF
  "text/plain", // TXT
]

export function FileUploadProvider({ children }: FileUploadProviderProps) {
  const { toast } = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [fileAttachments, setFileAttachments] = useState<FileAttachment[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Helper function to convert a file to a data URL
  const convertToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
      reader.readAsDataURL(file)
    })
  }

  const addFiles = useCallback(
    async (newFiles: File[]) => {
      // Filter out unsupported file types
      const validFiles: File[] = []
      const invalidFiles: File[] = []

      newFiles.forEach((file) => {
        if (ALLOWED_FILE_TYPES.includes(file.type)) {
          validFiles.push(file)
        } else {
          invalidFiles.push(file)
        }
      })

      // Show error for invalid files
      if (invalidFiles.length > 0) {
        const fileNames = invalidFiles.map((f) => f.name).join(", ")
        const errorMessage = `Unsupported file type${invalidFiles.length > 1 ? "s" : ""}: ${fileNames}. Only PDF and TXT files are supported.`

        // Track error in PostHog
        analytics.trackError("invalid_file_type", errorMessage)

        toast({
          title: "Invalid file type",
          description: errorMessage,
          type: "error",
          duration: 5000,
        })
      }

      // If no valid files, return early
      if (validFiles.length === 0) return

      // Add valid files
      setFiles((prev) => [...prev, ...validFiles])

      // Track file upload in PostHog
      analytics.trackFileUpload(validFiles.length)

      try {
        // Convert new files to attachments one by one to avoid memory issues
        const newAttachments: FileAttachment[] = []

        for (const file of validFiles) {
          try {
            const dataUrl = await convertToDataURL(file)
            newAttachments.push({
              name: file.name,
              contentType: file.type,
              data: dataUrl,
            })
          } catch (fileError) {
            console.error(`Error processing file ${file.name}:`, fileError)

            // Track individual file error
            analytics.trackError("individual_file_processing", `Failed to process ${file.name}`)

            toast({
              title: `Error processing ${file.name}`,
              description: "This file could not be processed and will be skipped.",
              type: "error",
              duration: 5000,
            })

            // Remove the failed file from the files array
            setFiles((prev) => prev.filter((f) => f.name !== file.name))
          }
        }

        // Update file attachments with successfully processed files
        if (newAttachments.length > 0) {
          setFileAttachments((prev) => [...prev, ...newAttachments])
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to prepare files for processing"

        // Track error in PostHog
        analytics.trackError("file_processing", errorMessage)

        toast({
          title: "Error preparing files",
          description: errorMessage,
          type: "error",
          duration: 5000,
        })
      }
    },
    [toast],
  )

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setFileAttachments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const prepareFileAttachments = useCallback(async () => {
    // If we already have attachments for all files, just return them
    if (files.length === fileAttachments.length && files.length > 0) {
      return fileAttachments
    }

    if (files.length === 0) {
      return []
    }

    try {
      const attachments: FileAttachment[] = []

      // Process files one by one to avoid memory issues and provide better error handling
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        try {
          const dataUrl = await convertToDataURL(file)
          attachments.push({
            name: file.name,
            contentType: file.type,
            data: dataUrl,
          })
        } catch (fileError) {
          console.error(`Error preparing file ${file.name}:`, fileError)

          // Track individual file error
          analytics.trackError("file_preparation_individual", `Failed to prepare ${file.name}`)

          toast({
            title: `Error preparing ${file.name}`,
            description: "This file will be skipped from processing.",
            type: "warning",
            duration: 5000,
          })
        }
      }

      if (attachments.length === 0) {
        throw new Error("No files could be prepared for processing")
      }

      setFileAttachments(attachments)
      return attachments
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to prepare files for processing"

      // Track error in PostHog
      analytics.trackError("file_preparation", errorMessage)

      toast({
        title: "Error preparing files",
        description: errorMessage,
        type: "error",
        duration: 5000,
      })
      throw error
    }
  }, [files, fileAttachments, toast])

  const value = {
    files,
    fileAttachments,
    isDragging,
    addFiles,
    removeFile,
    setIsDragging,
    prepareFileAttachments,
  }

  return <FileUploadContext.Provider value={value}>{children}</FileUploadContext.Provider>
}
