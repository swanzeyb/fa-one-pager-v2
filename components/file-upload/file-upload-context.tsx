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
      setFiles((prev) => [...prev, ...newFiles])

      // Track file upload in PostHog
      analytics.trackFileUpload(newFiles.length)

      try {
        // Convert new files to attachments
        const newAttachments = await Promise.all(
          newFiles.map(async (file) => ({
            name: file.name,
            contentType: file.type,
            data: await convertToDataURL(file),
          })),
        )

        // Update file attachments
        setFileAttachments((prev) => [...prev, ...newAttachments])
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
    if (files.length === fileAttachments.length) {
      return fileAttachments
    }

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
