"use client"

import { useState, useEffect } from "react"
import { Send, ChevronDown, Linkedin, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

interface PanelFooterProps {
  className?: string
}

export function PanelFooter({ className = "" }: PanelFooterProps) {
  const { toast } = useToast()
  const [isDisabled, setIsDisabled] = useState(false)

  // Check if the button was previously disabled in this session
  useEffect(() => {
    const wasDisabled = sessionStorage.getItem("sendButtonDisabled") === "true"
    if (wasDisabled) {
      setIsDisabled(true)
    }
  }, [])

  const handleSendClick = () => {
    toast({
      title: "Feature in progress",
      description: "The send functionality is currently being developed. Please check back later.",
      type: "info",
      duration: 5000,
    })

    // Disable the button for the rest of the session
    setIsDisabled(true)
    sessionStorage.setItem("sendButtonDisabled", "true")
  }

  const handleSocialClick = (platform: string) => {
    toast({
      title: `${platform} sharing coming soon`,
      description: `Sharing to ${platform} is currently being developed. Please check back later.`,
      type: "info",
      duration: 5000,
    })

    // Disable the button for the rest of the session
    setIsDisabled(true)
    sessionStorage.setItem("sendButtonDisabled", "true")
  }

  return (
    <div className={`border-t p-3 bg-gray-50 flex justify-end ${className}`}>
      <div className="flex">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                {" "}
                {/* Wrapper div to ensure tooltip works with disabled button */}
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-r-none px-3"
                  onClick={handleSendClick}
                  disabled={isDisabled}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </TooltipTrigger>
            {isDisabled && (
              <TooltipContent side="top" className="bg-black text-white p-2 z-50">
                This feature is currently in development
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  {" "}
                  {/* Wrapper div to ensure tooltip works with disabled button */}
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-l-none border-l border-l-primary-foreground/20 px-2"
                      disabled={isDisabled}
                    >
                      <ChevronDown className="h-4 w-4" />
                      <span className="sr-only">Send options</span>
                    </Button>
                  </DropdownMenuTrigger>
                </div>
              </TooltipTrigger>
              {isDisabled && (
                <TooltipContent side="top" className="bg-black text-white p-2 z-50">
                  Sharing options are currently in development
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
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
    </div>
  )
}
