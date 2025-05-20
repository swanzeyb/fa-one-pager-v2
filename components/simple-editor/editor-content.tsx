"use client"

import { useSimpleEditor } from "./simple-editor-context"
import { useEffect } from "react"

interface EditorContentProps {
  className?: string
}

export function EditorContent({ className = "" }: EditorContentProps) {
  const { editorRef, isReadOnly, handleContentChange } = useSimpleEditor()

  // Add key event handling for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !isReadOnly) {
        // Let the browser handle the Enter key naturally
        // This will create a new line in contentEditable elements
        handleContentChange()
      }
    }

    const editorElement = editorRef.current
    if (editorElement) {
      editorElement.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [editorRef, isReadOnly, handleContentChange])

  return (
    <div
      ref={editorRef}
      contentEditable={!isReadOnly}
      onInput={handleContentChange}
      onBlur={handleContentChange}
      className={`p-4 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto focus:outline-none ${className}`}
      style={{
        whiteSpace: "pre-wrap",
        counterReset: "item", // Reset counter for ordered lists
      }}
    />
  )
}
