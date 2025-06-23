"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { analytics } from "@/lib/posthog"

interface WebReviewFormProps {
  className?: string
  disabled?: boolean
}

export function WebReviewForm({ className = "", disabled = false }: WebReviewFormProps) {
  const { toast } = useToast()
  const [primaryAuthor, setPrimaryAuthor] = useState("")
  const [secondaryAuthors, setSecondaryAuthors] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!primaryAuthor.trim()) {
      toast({
        title: "Primary Author Required",
        description: "Please enter a primary author before sending for review.",
        type: "warning",
        duration: 3000,
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Track form submission in PostHog
      analytics.trackSend("web_review")

      // Simulate form submission (replace with actual implementation)
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "Sent for web review",
        description: "Your content has been submitted for web review successfully.",
        type: "success",
        duration: 3000,
      })

      // Reset form
      setPrimaryAuthor("")
      setSecondaryAuthors("")
    } catch (error) {
      console.error("Error submitting for web review:", error)

      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to submit for web review. Please try again."

      analytics.trackError("web_review_submit_failed", errorMessage)

      toast({
        title: "Submission failed",
        description: errorMessage,
        type: "error",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Send for Web Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="primary-author">Primary Author *</Label>
            <Input
              id="primary-author"
              type="text"
              value={primaryAuthor}
              onChange={(e) => setPrimaryAuthor(e.target.value)}
              placeholder="Enter primary author name"
              disabled={disabled || isSubmitting}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="secondary-authors">Secondary Authors</Label>
            <Input
              id="secondary-authors"
              type="text"
              value={secondaryAuthors}
              onChange={(e) => setSecondaryAuthors(e.target.value)}
              placeholder="Enter secondary authors (comma-separated)"
              disabled={disabled || isSubmitting}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={disabled || isSubmitting || !primaryAuthor.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? "Sending..." : "Send for web review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
