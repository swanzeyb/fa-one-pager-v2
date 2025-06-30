'use client'

import { useFileUpload } from '@/components/file-upload/file-upload-context'
import { useOutput } from '@/components/output/output-context'

export type Step = 1 | 2 | 3

export function useStepTracker(): {
  currentStep: Step
  isStepComplete: (step: Step) => boolean
} {
  const { files } = useFileUpload()
  const { outputs, isProcessing } = useOutput()

  const hasFiles = files.length > 0
  const hasGeneratedContent = outputs.mediumSummary || outputs.howToGuide
  const isGenerating = isProcessing.mediumSummary || isProcessing.howToGuide

  // Determine current step based on application state
  const getCurrentStep = (): Step => {
    if (!hasFiles) return 1 // Need to upload files first
    if (!hasGeneratedContent && !isGenerating) return 2 // Ready to generate
    if (hasGeneratedContent) return 3 // Ready to send (download is optional)
    return 2 // Default to step 2 if generating
  }

  // Check if a step is complete
  const isStepComplete = (step: Step): boolean => {
    switch (step) {
      case 1:
        return hasFiles
      case 2:
        return Boolean(hasGeneratedContent)
      case 3:
        return Boolean(hasGeneratedContent) // Step 3 (send) is available when content exists
      default:
        return false
    }
  }

  return {
    currentStep: getCurrentStep(),
    isStepComplete,
  }
}
