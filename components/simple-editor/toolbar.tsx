"use client"

import { Button } from "@/components/ui/button"
import { Bold, Italic, List, Heading, Link } from "lucide-react"
import { useSimpleEditor } from "./simple-editor-context"

interface ToolbarProps {
  className?: string
}

export function Toolbar({ className = "" }: ToolbarProps) {
  const { formatText, isReadOnly } = useSimpleEditor()

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
    </div>
  )
}
