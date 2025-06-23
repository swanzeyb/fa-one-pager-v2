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
      let newHtmlContent = editorRef.current.innerHTML

      // Store current selection for restoration
      const selection = window.getSelection()
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null
      let selectionContainer: Node | null = null
      let selectionOffset = 0

      if (range && range.startContainer) {
        selectionContainer = range.startContainer
        selectionOffset = range.startOffset
      }

      // Fix empty paragraphs by adding <br> tags to make them visible
      newHtmlContent = newHtmlContent.replace(/<p><\/p>/g, '<p><br></p>')
      newHtmlContent = newHtmlContent.replace(/<p>\s*<\/p>/g, '<p><br></p>')

      // Fix empty headings
      newHtmlContent = newHtmlContent.replace(
        /<h([1-6])><\/h[1-6]>/g,
        '<h$1><br></h$1>'
      )
      newHtmlContent = newHtmlContent.replace(
        /<h([1-6])>\s*<\/h[1-6]>/g,
        '<h$1><br></h$1>'
      )

      // Remove any completely empty divs that might have been created
      newHtmlContent = newHtmlContent.replace(/<div><\/div>/g, '')
      newHtmlContent = newHtmlContent.replace(/<div>\s*<\/div>/g, '')

      // Ensure we always have at least one paragraph
      if (!newHtmlContent.trim() || newHtmlContent.trim() === '<br>') {
        newHtmlContent = '<p><br></p>'
      }

      // Update the editor content if we made changes
      if (newHtmlContent !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = newHtmlContent

        // Restore cursor position if possible
        if (selectionContainer && selection) {
          try {
            // Try to find the same container in the updated DOM
            const walker = document.createTreeWalker(
              editorRef.current,
              NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
              null
            )

            let node: Node | null = null
            let foundContainer = false

            while ((node = walker.nextNode())) {
              if (
                node === selectionContainer ||
                (node.nodeType === Node.TEXT_NODE &&
                  selectionContainer.nodeType === Node.TEXT_NODE &&
                  node.textContent === selectionContainer.textContent)
              ) {
                const newRange = document.createRange()
                const maxOffset =
                  node.nodeType === Node.TEXT_NODE
                    ? node.textContent?.length || 0
                    : node.childNodes.length

                newRange.setStart(node, Math.min(selectionOffset, maxOffset))
                newRange.collapse(true)
                selection.removeAllRanges()
                selection.addRange(newRange)
                foundContainer = true
                break
              }
            }

            if (!foundContainer) {
              // Fallback: place cursor at the end
              const newRange = document.createRange()
              newRange.selectNodeContents(editorRef.current)
              newRange.collapse(false)
              selection.removeAllRanges()
              selection.addRange(newRange)
            }
          } catch (error) {
            // If restoring selection fails, just focus at the end
            try {
              const newRange = document.createRange()
              newRange.selectNodeContents(editorRef.current)
              newRange.collapse(false)
              selection.removeAllRanges()
              selection.addRange(newRange)
            } catch (fallbackError) {
              // Final fallback - just focus the editor
              editorRef.current.focus()
            }
          }
        }
      }

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
