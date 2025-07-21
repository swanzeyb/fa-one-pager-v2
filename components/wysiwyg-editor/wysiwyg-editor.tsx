'use client'

import { useState, useEffect, forwardRef } from 'react'
import Editor from 'react-simple-wysiwyg'
import {
  parseHtmlToStructure,
  type StructuredElement,
} from '@/utils/html-parser'
import { useImageStore } from '@/stores'

interface WysiwygEditorProps {
  content: string
  onChange?: (content: string) => void
  readOnly?: boolean
  placeholder?: string
  className?: string
}

export const WysiwygEditor = forwardRef<HTMLDivElement, WysiwygEditorProps>(
  (
    {
      content,
      onChange,
      readOnly = false,
      placeholder = 'Start typing...',
      className = '',
    },
    ref
  ) => {
    const [htmlContent, setHtmlContent] = useState(content)
    const [structuredContent, setStructuredContent] = useState<
      StructuredElement[]
    >([])
    const getAllImages = useImageStore((state) => state.getAllImages)

    // Process content with image replacements
    useEffect(() => {
      let processedHtml = content

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

      // Parse the HTML to structured content
      try {
        const structured = parseHtmlToStructure(processedHtml)
        setStructuredContent(structured)
      } catch (error) {
        console.error('Error parsing HTML to structure:', error)
        setStructuredContent([])
      }
    }, [content, getAllImages])

    const handleChange = (e: any) => {
      const newContent = e.target.value
      setHtmlContent(newContent)

      // Parse the HTML to structured content
      try {
        const structured = parseHtmlToStructure(newContent)
        setStructuredContent(structured)
      } catch (error) {
        console.error('Error parsing HTML to structure:', error)
      }

      if (onChange) {
        onChange(newContent)
      }
    }

    return (
      <div ref={ref} className={`wysiwyg-editor ${className}`}>
        <Editor
          value={htmlContent}
          onChange={handleChange}
          placeholder={placeholder}
          containerProps={{
            style: {
              resize: 'vertical',
              minHeight: '300px',
              border: '1px solid #e2e8f0',
              borderRadius: '0.375rem',
            },
          }}
          style={{
            minHeight: '250px',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
        />
        <style jsx global>{`
          .wysiwyg-editor .ql-editor {
            min-height: 250px;
            font-size: 14px;
            line-height: 1.5;
          }
          .wysiwyg-editor h1 {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            margin-top: 0;
          }
          .wysiwyg-editor h2 {
            font-size: 1.25rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            margin-top: 1rem;
          }
          .wysiwyg-editor h3 {
            font-size: 1.125rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            margin-top: 0.75rem;
          }
          .wysiwyg-editor p {
            margin-bottom: 0.75rem;
            margin-top: 0;
            min-height: 1.2em;
          }
          .wysiwyg-editor ul,
          .wysiwyg-editor ol {
            margin-bottom: 0.75rem;
            padding-left: 1.5rem;
          }
          .wysiwyg-editor li {
            margin-bottom: 0.25rem;
          }
          .wysiwyg-editor strong {
            font-weight: bold;
          }
          .wysiwyg-editor em {
            font-style: italic;
          }
          .wysiwyg-editor blockquote {
            border-left: 4px solid #e2e8f0;
            padding-left: 1rem;
            margin: 1rem 0;
            font-style: italic;
          }
        `}</style>
      </div>
    )
  }
)

WysiwygEditor.displayName = 'WysiwygEditor'

// Export helper hook for compatibility
export function useWysiwygEditor() {
  return {
    structuredContent: [],
    isReadOnly: false,
  }
}
