"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Send, ChevronDown, Linkedin, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { analytics } from "@/lib/posthog"

interface PanelFooterProps {
  className?: string
}

export function PanelFooter({ className = "" }: PanelFooterProps) {
  const { toast } = useToast()
  const [isDisabled, setIsDisabled] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [tooltipText, setTooltipText] = useState("")

  // Check if the button was previously disabled in this session
  useEffect(() => {
    const wasDisabled = sessionStorage.getItem("sendButtonDisabled") === "true"
    if (wasDisabled) {
      setIsDisabled(true)
    }
  }, [])

  const handleSendClick = () => {
    // Track send button click in PostHog
    analytics.trackSend()

    toast({
      title: "Feature in progress",
      description: "The send functionality is currently being developed. Please check back later.",
      type: "info", // Explicitly set type to info
      duration: 5000,
    })

    // Disable the button for the rest of the session
    setIsDisabled(true)
    sessionStorage.setItem("sendButtonDisabled", "true")
  }

  const handleSocialClick = (platform: string) => {
    // Track social share click in PostHog
    analytics.trackSend(platform)

    toast({
      title: `${platform} sharing coming soon`,
      description: `Sharing to ${platform} is currently being developed. Please check back later.`,
      type: "info", // Explicitly set type to info
      duration: 5000,
    })

    // Disable the button for the rest of the session
    setIsDisabled(true)
    sessionStorage.setItem("sendButtonDisabled", "true")
  }

  const handleMouseEnter = (e: React.MouseEvent, text: string) => {
    if (isDisabled) {
      const rect = e.currentTarget.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      })
      setTooltipText(text)
      setShowTooltip(true)
    }
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  return (
    <div className={`border-t p-3 bg-gray-50 flex justify-end mt-auto ${className} relative`}>
      <div className="flex">
        <Button
          variant="default"
          size="sm"
          className="rounded-r-none px-3"
          onClick={handleSendClick}
          disabled={isDisabled}
          onMouseEnter={(e) => handleMouseEnter(e, "This feature is currently in development")}
          onMouseLeave={handleMouseLeave}
        >
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="rounded-l-none border-l border-l-primary-foreground/20 px-2"
              disabled={isDisabled}
              onMouseEnter={(e) => handleMouseEnter(e, "Sharing options are currently in development")}
              onMouseLeave={handleMouseLeave}
            >
              <ChevronDown className="h-4 w-4" />
              <span className="sr-only">Send options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleSocialClick("LinkedIn")}>
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSocialClick("Twitter")}>
              <Twitter className="h-4 w-4 mr-2" />X / Twitter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Custom tooltip implementation */}
      {showTooltip && isDisabled && (
        <div
          className="absolute bg-black text-white text-xs rounded py-1 px-2 z-50 transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            position: "fixed",
          }}
        >
          {tooltipText}
          <div className="tooltip-arrow absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </div>
      )}
    </div>
  )
}
