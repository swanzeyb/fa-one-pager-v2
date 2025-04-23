"use client"

import type { ReactNode } from "react"
import { forwardRef } from "react"
import { SimpleEditorProvider } from "./simple-editor-context"

interface SimpleEditorProps {
  content: string
  onChange?: (content: string) => void
  readOnly?: boolean
  children: ReactNode
}

export const SimpleEditor = forwardRef<HTMLDivElement, SimpleEditorProps>(
  ({ content, onChange, readOnly = false, children }, ref) => {
    return (
      <SimpleEditorProvider initialContent={content} onChange={onChange} readOnly={readOnly} forwardedRef={ref}>
        <div className="simple-editor border-t overflow-hidden">{children}</div>
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
      </SimpleEditorProvider>
    )
  },
)

SimpleEditor.displayName = "SimpleEditor"
