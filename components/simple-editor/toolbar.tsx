"use client"

import { Button } from "@/components/ui/button"
import { Bold, Italic, List, Heading, Link, ImageIcon } from "lucide-react"
import { useSimpleEditor } from "./simple-editor-context"
import { useFeatureFlag, FEATURE_FLAGS } from "@/lib/posthog"

interface ToolbarProps {
  className?: string
}

export function Toolbar({ className = "" }: ToolbarProps) {
  const { formatText, isReadOnly } = useSimpleEditor()
  const isImageUploadEnabled = useFeatureFlag(FEATURE_FLAGS.IMAGE_UPLOAD)

  if (isReadOnly) return null

  return (
    <div className={`flex items-center gap-1 p-2 border-b bg-gray-50 ${className}`}>
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

      {/* Only show image button if feature is enabled */}
      {isImageUploadEnabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            // Image insertion logic would go here
            alert("Image insertion coming soon!")
          }}
          className="p-1 h-8 w-8"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
