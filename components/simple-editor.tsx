"use client"

import { useEffect, useState, useRef } from "react"
import { useImageUpload } from "./image-upload-context"
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, Heading, Link } from "lucide-react"

interface SimpleEditorProps {
  content: string
  onChange?: (content: string) => void
  readOnly?: boolean
}

export function SimpleEditor({ content, onChange, readOnly = false }: SimpleEditorProps) {
  const [editorContent, setEditorContent] = useState("")
  const editorRef = useRef<HTMLDivElement>(null)
  const { getAllImages } = useImageUpload()

  // Initialize content when component mounts
  useEffect(() => {
    // Convert markdown to HTML for the editor
    // This is a simple conversion for demonstration
    const htmlContent = content
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

    // Replace placeholder images with actual images
    const images = getAllImages()
    Object.entries(images).forEach(([key, dataUrl]) => {
      const imgKey = key.replace("img-", "")
      const regex = new RegExp(`/placeholder\\.svg\\?.*?query=${imgKey}.*?`, "g")
      htmlContent.replace(regex, dataUrl)
    })

    setEditorContent(htmlContent)

    if (editorRef.current) {
      editorRef.current.innerHTML = htmlContent
    }
  }, [content, getAllImages])

  // Handle content changes
  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML
      setEditorContent(newContent)
      if (onChange) {
        onChange(newContent)
      }
    }
  }

  // Format commands
  const formatText = (command: string, value?: string) => {
    if (readOnly) return
    document.execCommand(command, false, value)
    handleContentChange()
  }

  return (
    <div className="simple-editor border-t overflow-hidden">
      {!readOnly && (
        <div className="toolbar flex items-center gap-1 p-2 border-b bg-gray-50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText("formatBlock", "h2")}
            className="p-1 h-8 w-8"
          >
            <Heading className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => formatText("bold")} className="p-1 h-8 w-8">
            <Bold className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => formatText("italic")} className="p-1 h-8 w-8">
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText("insertUnorderedList")}
            className="p-1 h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = prompt("Enter link URL")
              if (url) formatText("createLink", url)
            }}
            className="p-1 h-8 w-8"
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleContentChange}
        onBlur={handleContentChange}
        className="p-4 min-h-[200px] max-h-[calc(100vh-350px)] overflow-y-auto focus:outline-none"
        style={{ whiteSpace: "pre-wrap" }}
      />
      <style jsx global>{`
        .simple-editor h1 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        .simple-editor h2 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        .simple-editor h3 {
          font-size: 1.125rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        .simple-editor ul, .simple-editor ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .simple-editor ul {
          list-style-type: disc;
        }
        .simple-editor ol {
          list-style-type: decimal;
        }
        .simple-editor img {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
        }
        .simple-editor a {
          color: #3b82f6;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
