"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useImageUpload } from "./image-upload-context"

interface ImageUploadProps {
  alt: string
  src?: string
  className?: string
}

export function ImageUpload({ alt, src, className = "" }: ImageUploadProps) {
  const { addImage, getImage } = useImageUpload()
  const [image, setImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Create a safe key from the alt text
  const imageKey = `img-${alt.replace(/\s+/g, "-").toLowerCase()}`

  useEffect(() => {
    // Check if we already have this image in our context
    const existingImage = getImage(imageKey)
    if (existingImage) {
      setImage(existingImage)
    } else if (src && !src.includes("placeholder")) {
      setImage(src)
      addImage(imageKey, src)
    }
  }, [src, alt, addImage, getImage, imageKey])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setImage(dataUrl)
      addImage(imageKey, dataUrl)
      setIsUploading(false)
    }
    reader.onerror = () => {
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="my-4">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {image ? (
        <div className="relative group">
          <img src={image || "/placeholder.svg"} alt={alt} className={`max-w-full h-auto rounded-md ${className}`} />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button variant="secondary" size="sm" onClick={triggerFileInput} className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              Replace Image
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={triggerFileInput}
          className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 text-center mb-1">{isUploading ? "Uploading..." : "Upload an image"}</p>
          <p className="text-xs text-gray-400 text-center">{alt}</p>
        </div>
      )}
    </div>
  )
}
