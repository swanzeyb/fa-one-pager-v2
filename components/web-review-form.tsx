'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { analytics } from '@/lib/posthog'
import { useOutput } from './output/output-context'
import { generateDOCX } from '@/app/actions'
import { useStepTracker } from '@/hooks/use-step-tracker'

interface WebReviewFormProps {
  className?: string
  disabled?: boolean
}

export function WebReviewForm({
  className = '',
  disabled = false,
}: WebReviewFormProps) {
  const { toast } = useToast()
  const { outputs } = useOutput()
  const { currentStep, isStepComplete } = useStepTracker()
  const [primaryAuthor, setPrimaryAuthor] = useState('')
  const [secondaryAuthors, setSecondaryAuthors] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isStep3Current = currentStep === 3
  const isStep3Complete = isStepComplete(3)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!primaryAuthor.trim()) {
      toast({
        title: 'Primary Author Required',
        description: 'Please enter a primary author before sending for review.',
        type: 'warning',
        duration: 3000,
      })
      return
    }

    // Check if we have content to send
    if (!outputs.mediumSummary && !outputs.howToGuide) {
      toast({
        title: 'No content to send',
        description: 'Please generate content first before sending for review.',
        type: 'warning',
        duration: 3000,
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Track form submission in PostHog
      analytics.trackSend('web_review')

      // Get the current date for the document title
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      // Create a properly structured combined document
      let combinedContent = ''

      // Add medium summary if available
      if (outputs.mediumSummary) {
        combinedContent += outputs.mediumSummary
      }

      // Add a page break and how-to guide if available
      if (outputs.howToGuide) {
        // Add a page break between sections
        combinedContent += '<div style="page-break-before: always;"></div>'

        // If the how-to guide doesn't start with a heading, add one
        if (!outputs.howToGuide.includes('<h1>')) {
          combinedContent += '<h1>How-to Guide</h1>'
        }

        combinedContent += outputs.howToGuide
      }

      // Generate the DOCX with a proper title including author info
      const documentTitle = `Research Summary - ${currentDate} - ${primaryAuthor}`
      const dataUri = await generateDOCX(combinedContent, documentTitle)

      // Convert data URI to Blob
      const response = await fetch(dataUri)
      const blob = await response.blob()

      // Create File object
      const filename = `research-summary-${currentDate
        .toLowerCase()
        .replace(/\s+/g, '-')}.docx`
      const file = new File([blob], filename, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })

      // Send to API
      const form = new FormData()
      form.append('file', file)

      const apiResponse = await fetch('/api/send-mail', {
        method: 'POST',
        body: form,
      })

      const result = await apiResponse.json()

      if (result.status === 'success') {
        toast({
          title: 'Sent for web review',
          description:
            'Your content has been submitted for web review successfully.',
          type: 'success',
          duration: 3000,
        })

        // Reset form
        setPrimaryAuthor('')
        setSecondaryAuthors('')
      } else {
        throw new Error(result.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error submitting for web review:', error)

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to submit for web review. Please try again.'

      analytics.trackError('web_review_submit_failed', errorMessage)

      toast({
        title: 'Submission failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span
            className={`text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center ${
              isStep3Current
                ? 'bg-blue-500 text-white'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            3
          </span>
          Send for Web Review
        </CardTitle>
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
            className={`w-full ${
              isStep3Current
                ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700'
                : ''
            }`}
            disabled={
              disabled ||
              isSubmitting ||
              !primaryAuthor.trim() ||
              (!outputs.mediumSummary && !outputs.howToGuide)
            }
          >
            <span
              className={`mr-2 text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                isStep3Current
                  ? 'bg-blue-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              3
            </span>
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send for web review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
