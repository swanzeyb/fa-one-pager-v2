"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type ImageMap = Record<string, string>

interface ImageUploadContextType {
  images: ImageMap
  addImage: (key: string, dataUrl: string) => void
  getImage: (key: string) => string | undefined
  getAllImages: () => ImageMap
}

const ImageUploadContext = createContext<ImageUploadContextType | undefined>(undefined)

export function ImageUploadProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<ImageMap>({})

  const addImage = (key: string, dataUrl: string) => {
    setImages((prev) => ({ ...prev, [key]: dataUrl }))
  }

  const getImage = (key: string) => {
    return images[key]
  }

  const getAllImages = () => {
    return images
  }

  return (
    <ImageUploadContext.Provider value={{ images, addImage, getImage, getAllImages }}>
      {children}
    </ImageUploadContext.Provider>
  )
}

export function useImageUpload() {
  const context = useContext(ImageUploadContext)
  if (context === undefined) {
    throw new Error("useImageUpload must be used within an ImageUploadProvider")
  }
  return context
}
