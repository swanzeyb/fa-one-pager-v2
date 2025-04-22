'use client'

import type React from 'react'

import { useState, useRef } from 'react'
import { Upload, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageUploadProps {
  alt: string
  src?: string
  className?: string
}

export function ImageUpload({ alt, src, className = '' }: ImageUploadProps) {
  const [image, setImage] = useState<string | null>(src || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      setImage(reader.result as string)
      setIsUploading(false)
    }
    reader.onerror = () => {
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="my-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {image ? (
        <div className="relative group">
          <img
            src={image || '/placeholder.svg'}
            alt={alt}
            className={`max-w-full h-auto rounded-md ${className}`}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={triggerFileInput}
              className="flex items-center gap-1"
            >
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
          <p className="text-sm text-gray-500 text-center mb-1">
            {isUploading ? 'Uploading...' : 'Upload an image'}
          </p>
          <p className="text-xs text-gray-400 text-center">{alt}</p>
        </div>
      )}
    </div>
  )
}
