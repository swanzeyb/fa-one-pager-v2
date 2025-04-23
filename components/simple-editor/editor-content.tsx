"use client"

import { useSimpleEditor } from "./simple-editor-context"

interface EditorContentProps {
  className?: string
}

export function EditorContent({ className = "" }: EditorContentProps) {
  const { editorRef, isReadOnly, handleContentChange } = useSimpleEditor()

  return (
    <div
      ref={editorRef}
      contentEditable={!isReadOnly}
      onInput={handleContentChange}
      onBlur={handleContentChange}
      className={`p-4 min-h-[200px] max-h-[calc(100vh-350px)] overflow-y-auto focus:outline-none ${className}`}
      style={{ whiteSpace: "pre-wrap" }}
    />
  )
}
