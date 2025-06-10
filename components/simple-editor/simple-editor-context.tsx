'use client'

import type React from 'react'

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from 'react'
import { useImageUpload } from '../image-upload-context'
import {
  parseHtmlToStructure,
  type StructuredElement,
} from '@/utils/html-parser'

interface SimpleEditorContextType {
  content: string
  htmlContent: string
  structuredContent: StructuredElement[]
  editorRef: React.RefObject<HTMLDivElement | null>
  isReadOnly: boolean
  updateContent: (newContent: string) => void
  formatText: (command: string, value?: string) => void
  handleContentChange: () => void
}

const SimpleEditorContext = createContext<SimpleEditorContextType | undefined>(
  undefined
)

export function useSimpleEditor() {
  const context = useContext(SimpleEditorContext)
  if (context === undefined) {
    throw new Error(
      'useSimpleEditor must be used within a SimpleEditorProvider'
    )
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
  const [htmlContent, setHtmlContent] = useState('')
  const [structuredContent, setStructuredContent] = useState<
    StructuredElement[]
  >([])
  const internalEditorRef = useRef<HTMLDivElement>(null)
  const editorRef = forwardedRef || internalEditorRef
  const { getAllImages } = useImageUpload()

  // Initialize content when component mounts or content changes
  useEffect(() => {
    // The content is already HTML, so we can use it directly
    let processedHtml = initialContent

    // Replace placeholder images with actual images if needed
    const images = getAllImages()
    Object.entries(images).forEach(([key, dataUrl]) => {
      const imgKey = key.replace('img-', '')
      const regex = new RegExp(
        `/placeholder\\.svg\\?.*?query=${imgKey}.*?`,
        'g'
      )
      processedHtml = processedHtml.replace(regex, dataUrl)
    })

    setHtmlContent(processedHtml)
    setContent(initialContent)

    // Parse the HTML to structured content
    try {
      const structured = parseHtmlToStructure(processedHtml)
      setStructuredContent(structured)
    } catch (error) {
      console.error('Error parsing HTML to structure:', error)
      setStructuredContent([])
    }

    if (
      typeof editorRef === 'object' &&
      editorRef &&
      'current' in editorRef &&
      editorRef.current
    ) {
      editorRef.current.innerHTML = processedHtml
    }
  }, [initialContent, getAllImages, editorRef])

  const handleContentChange = () => {
    if (
      typeof editorRef === 'object' &&
      editorRef &&
      'current' in editorRef &&
      editorRef.current
    ) {
      const newHtmlContent = editorRef.current.innerHTML
      setHtmlContent(newHtmlContent)

      // Parse the HTML to structured content
      try {
        const structured = parseHtmlToStructure(newHtmlContent)
        setStructuredContent(structured)
      } catch (error) {
        console.error('Error parsing HTML to structure:', error)
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

    // Special handling for certain commands
    if (command === 'formatBlock' && value === 'h2') {
      // First check if we're already in an h1 or h2
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const parentElement = range.commonAncestorContainer.parentElement

        // If we're in an h1 or h2, we need to handle this differently
        if (
          parentElement &&
          (parentElement.tagName === 'H1' || parentElement.tagName === 'H2')
        ) {
          // Create a new paragraph after the heading
          const newParagraph = document.createElement('p')
          newParagraph.innerHTML = '<br>'

          // Insert it after the heading
          if (parentElement.nextSibling) {
            parentElement.parentNode?.insertBefore(
              newParagraph,
              parentElement.nextSibling
            )
          } else {
            parentElement.parentNode?.appendChild(newParagraph)
          }

          // Move cursor to the new paragraph
          range.selectNodeContents(newParagraph)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)

          handleContentChange()
          return
        }
      }
    }

    // Default behavior for other commands
    document.execCommand(command, false, value)
    handleContentChange()
  }

  const value = {
    content,
    htmlContent,
    structuredContent,
    editorRef:
      typeof editorRef === 'object' && editorRef && 'current' in editorRef
        ? editorRef
        : internalEditorRef,
    isReadOnly: readOnly,
    updateContent,
    formatText,
    handleContentChange,
  }

  return (
    <SimpleEditorContext.Provider value={value}>
      {children}
    </SimpleEditorContext.Provider>
  )
}
