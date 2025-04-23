"use client"

import type React from "react"

import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react"
import { useImageUpload } from "../image-upload-context"
import { parseHtmlToStructure, type StructuredElement } from "@/utils/html-parser"

interface SimpleEditorContextType {
  content: string
  htmlContent: string
  structuredContent: StructuredElement[]
  editorRef: React.RefObject<HTMLDivElement>
  isReadOnly: boolean
  updateContent: (newContent: string) => void
  formatText: (command: string, value?: string) => void
  handleContentChange: () => void
  convertMarkdownToHtml: (markdown: string) => string
}

const SimpleEditorContext = createContext<SimpleEditorContextType | undefined>(undefined)

export function useSimpleEditor() {
  const context = useContext(SimpleEditorContext)
  if (context === undefined) {
    throw new Error("useSimpleEditor must be used within a SimpleEditorProvider")
  }
  return context
}

interface SimpleEditorProviderProps {
  children: ReactNode
  initialContent: string
  onChange?: (content: string) => void
  readOnly?: boolean
  forwardedRef?: React.Ref<HTMLDivElement>
}

export function SimpleEditorProvider({
  children,
  initialContent,
  onChange,
  readOnly = false,
  forwardedRef,
}: SimpleEditorProviderProps) {
  const [content, setContent] = useState(initialContent)
  const [htmlContent, setHtmlContent] = useState("")
  const [structuredContent, setStructuredContent] = useState<StructuredElement[]>([])
  const internalEditorRef = useRef<HTMLDivElement>(null)
  const editorRef = forwardedRef || internalEditorRef
  const { getAllImages } = useImageUpload()

  const convertMarkdownToHtml = (markdown: string): string => {
    // Convert markdown to HTML
    return markdown
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/\*\*(.*)\*\*/gm, "<strong>$1</strong>")
      .replace(/\*(.*)\*/gm, "<em>$1</em>")
      .replace(/!\[(.*?)\]$$(.*?)$$/gm, '<img src="$2" alt="$1" />')
      .replace(/\[(.*?)\]$$(.*?)$$/gm, '<a href="$2">$1</a>')
      .replace(/^(\d+\. )/gm, "<ol><li>")
      .replace(/^(- )/gm, "<ul><li>")
      .replace(/\n\n/gm, "<br /><br />")
  }

  // Initialize content when component mounts or content changes
  useEffect(() => {
    const convertedHtml = convertMarkdownToHtml(initialContent)

    // Replace placeholder images with actual images
    const images = getAllImages()
    let processedHtml = convertedHtml
    Object.entries(images).forEach(([key, dataUrl]) => {
      const imgKey = key.replace("img-", "")
      const regex = new RegExp(`/placeholder\\.svg\\?.*?query=${imgKey}.*?`, "g")
      processedHtml = processedHtml.replace(regex, dataUrl)
    })

    setHtmlContent(processedHtml)
    setContent(initialContent)

    // Parse the HTML to structured content
    try {
      const structured = parseHtmlToStructure(processedHtml)
      setStructuredContent(structured)
    } catch (error) {
      console.error("Error parsing HTML to structure:", error)
      setStructuredContent([])
    }

    if (typeof editorRef === "object" && editorRef && "current" in editorRef && editorRef.current) {
      editorRef.current.innerHTML = processedHtml
    }
  }, [initialContent, getAllImages, editorRef])

  const handleContentChange = () => {
    if (typeof editorRef === "object" && editorRef && "current" in editorRef && editorRef.current) {
      const newHtmlContent = editorRef.current.innerHTML
      setHtmlContent(newHtmlContent)

      // Parse the HTML to structured content
      try {
        const structured = parseHtmlToStructure(newHtmlContent)
        setStructuredContent(structured)
      } catch (error) {
        console.error("Error parsing HTML to structure:", error)
      }

      if (onChange) {
        onChange(newHtmlContent)
      }
    }
  }

  const updateContent = (newContent: string) => {
    setContent(newContent)
    if (onChange) {
      onChange(newContent)
    }
  }

  const formatText = (command: string, value?: string) => {
    if (readOnly) return
    document.execCommand(command, false, value)
    handleContentChange()
  }

  const value = {
    content,
    htmlContent,
    structuredContent,
    editorRef: typeof editorRef === "object" && editorRef && "current" in editorRef ? editorRef : internalEditorRef,
    isReadOnly: readOnly,
    updateContent,
    formatText,
    handleContentChange,
    convertMarkdownToHtml,
  }

  return <SimpleEditorContext.Provider value={value}>{children}</SimpleEditorContext.Provider>
}
