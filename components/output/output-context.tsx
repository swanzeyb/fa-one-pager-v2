'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  processOutput,
  type OutputType,
  type FileAttachment,
} from '@/app/actions'
import { analytics } from '@/lib/posthog'

interface OutputState {
  outputs: Record<OutputType, string>
  editedOutputs: Record<OutputType, string>
  isProcessing: Record<OutputType, boolean>
  errors: Record<OutputType, string | null>
  activeTab: OutputType
  retryCount: Record<OutputType, number>
}

interface OutputContextType extends OutputState {
  setActiveTab: (tab: OutputType) => void
  processOutputType: (
    outputType: OutputType,
    fileAttachments: FileAttachment[],
    isRegeneration?: boolean
  ) => Promise<void>
  processMultipleOutputs: (fileAttachments: FileAttachment[]) => Promise<void>
  updateEditedOutput: (outputType: OutputType, content: string) => void
  getOutputContent: (outputType: OutputType) => string
}

const OutputContext = createContext<OutputContextType | undefined>(undefined)

export function useOutput() {
  const context = useContext(OutputContext)
  if (context === undefined) {
    throw new Error('useOutput must be used within an OutputProvider')
  }
  return context
}

interface OutputProviderProps {
  children: ReactNode
}

export function OutputProvider({ children }: OutputProviderProps) {
  const { toast } = useToast()
  const [state, setState] = useState<OutputState>({
    outputs: {
      shortSummary: '',
      mediumSummary: '',
      howToGuide: '',
    },
    editedOutputs: {
      shortSummary: '',
      mediumSummary: '',
      howToGuide: '',
    },
    isProcessing: {
      shortSummary: false,
      mediumSummary: false,
      howToGuide: false,
    },
    errors: {
      shortSummary: null,
      mediumSummary: null,
      howToGuide: null,
    },
    activeTab: 'shortSummary',
    retryCount: {
      shortSummary: 0,
      mediumSummary: 0,
      howToGuide: 0,
    },
  })

  const setActiveTab = useCallback((tab: OutputType) => {
    // Track tab change in PostHog
    analytics.trackOutputGeneration(tab, false)
    setState((prev) => ({ ...prev, activeTab: tab }))
  }, [])

  const updateEditedOutput = useCallback(
    (outputType: OutputType, content: string) => {
      setState((prev) => ({
        ...prev,
        editedOutputs: { ...prev.editedOutputs, [outputType]: content },
      }))
    },
    []
  )

  const getOutputContent = useCallback(
    (outputType: OutputType) => {
      // Return edited content if it exists, otherwise return original output
      return state.editedOutputs[outputType] || state.outputs[outputType]
    },
    [state.editedOutputs, state.outputs]
  )

  const processOutputType = useCallback(
    async (
      outputType: OutputType,
      fileAttachments: FileAttachment[],
      isRegeneration = false
    ) => {
      if (fileAttachments.length === 0) {
        analytics.trackError('no_files', 'No files selected for processing')
        toast({
          title: 'No files selected',
          description: 'Please upload at least one file to process',
          type: 'warning',
          duration: 3000,
        })
        return
      }

      // Track generation/regeneration in PostHog
      analytics.trackOutputGeneration(outputType, isRegeneration)

      // Clear any previous errors
      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, [outputType]: null },
        isProcessing: { ...prev.isProcessing, [outputType]: true },
      }))

      try {
        // The processOutput function now has built-in retry logic
        const result = await processOutput(
          fileAttachments,
          outputType,
          isRegeneration
        )

        setState((prev) => ({
          ...prev,
          outputs: { ...prev.outputs, [outputType]: result },
          editedOutputs: { ...prev.editedOutputs, [outputType]: '' }, // Clear edited content
          isProcessing: { ...prev.isProcessing, [outputType]: false },
          retryCount: { ...prev.retryCount, [outputType]: 0 }, // Reset retry count on success
        }))

        toast({
          title: isRegeneration
            ? 'Regeneration complete'
            : 'Processing complete',
          description: `${getOutputTypeTitle(outputType)} has been ${
            isRegeneration ? 'regenerated' : 'generated'
          } successfully`,
          type: 'success',
          duration: 3000,
        })
      } catch (error) {
        console.error(`Error processing ${outputType}:`, error)

        // Set the error message
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to ${
                isRegeneration ? 'regenerate' : 'generate'
              } ${getOutputTypeTitle(outputType)}. Please try again.`

        // Track error in PostHog
        analytics.trackError(
          isRegeneration ? 'regeneration_failed' : 'generation_failed',
          `${outputType}: ${errorMessage}`
        )

        setState((prev) => ({
          ...prev,
          errors: { ...prev.errors, [outputType]: errorMessage },
          isProcessing: { ...prev.isProcessing, [outputType]: false },
        }))

        toast({
          title: 'Processing failed',
          description: errorMessage,
          type: 'error',
          duration: 7000,
        })
      }
    },
    [toast]
  )

  const processMultipleOutputs = useCallback(
    async (fileAttachments: FileAttachment[]) => {
      if (fileAttachments.length === 0) {
        analytics.trackError('no_files', 'No files selected for processing')
        toast({
          title: 'No files selected',
          description: 'Please upload at least one file to process',
          type: 'warning',
          duration: 3000,
        })
        return
      }

      // Track generation in PostHog
      analytics.trackOutputGeneration('multiple', false)

      // Initialize processing state atomically
      setState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          mediumSummary: null,
          howToGuide: null,
        },
        isProcessing: {
          ...prev.isProcessing,
          mediumSummary: true,
          howToGuide: true,
        },
      }))

      // Track results with state synchronization
      const results = {
        mediumSummary: { success: false, error: null as string | null },
        howToGuide: { success: false, error: null as string | null },
      }

      // Process medium summary with atomic state updates
      const processMediumSummary = async () => {
        try {
          const mediumResult = await processOutput(
            fileAttachments,
            'mediumSummary',
            false
          )

          // Update state atomically for medium summary success
          setState((prev) => ({
            ...prev,
            outputs: { ...prev.outputs, mediumSummary: mediumResult },
            editedOutputs: { ...prev.editedOutputs, mediumSummary: '' },
            isProcessing: { ...prev.isProcessing, mediumSummary: false },
            retryCount: { ...prev.retryCount, mediumSummary: 0 },
            errors: { ...prev.errors, mediumSummary: null },
          }))

          results.mediumSummary.success = true
        } catch (mediumError) {
          console.error('Error processing medium summary:', mediumError)

          const errorMessage =
            mediumError instanceof Error
              ? mediumError.message
              : 'Failed to generate medium summary'

          // Update state atomically for medium summary error
          setState((prev) => ({
            ...prev,
            errors: { ...prev.errors, mediumSummary: errorMessage },
            isProcessing: { ...prev.isProcessing, mediumSummary: false },
          }))

          results.mediumSummary.error = errorMessage
        }
      }

      // Process how-to guide with atomic state updates
      const processHowToGuide = async () => {
        try {
          const howToResult = await processOutput(
            fileAttachments,
            'howToGuide',
            false
          )

          // Update state atomically for how-to guide success
          setState((prev) => ({
            ...prev,
            outputs: { ...prev.outputs, howToGuide: howToResult },
            editedOutputs: { ...prev.editedOutputs, howToGuide: '' },
            isProcessing: { ...prev.isProcessing, howToGuide: false },
            retryCount: { ...prev.retryCount, howToGuide: 0 },
            errors: { ...prev.errors, howToGuide: null },
          }))

          results.howToGuide.success = true
        } catch (howToError) {
          console.error('Error processing how-to guide:', howToError)

          const errorMessage =
            howToError instanceof Error
              ? howToError.message
              : 'Failed to generate how-to guide'

          // Update state atomically for how-to guide error
          setState((prev) => ({
            ...prev,
            errors: { ...prev.errors, howToGuide: errorMessage },
            isProcessing: { ...prev.isProcessing, howToGuide: false },
          }))

          results.howToGuide.error = errorMessage
        }
      }

      try {
        // Process both outputs sequentially to avoid race conditions
        await processMediumSummary()
        await processHowToGuide()

        // Show appropriate toast based on synchronized results
        const successCount = Object.values(results).filter(
          (r) => r.success
        ).length
        const totalCount = Object.keys(results).length

        if (successCount === totalCount) {
          toast({
            title: 'Processing complete',
            description: 'All outputs have been generated successfully',
            type: 'success',
            duration: 3000,
          })
        } else if (successCount > 0) {
          toast({
            title: 'Partial success',
            description:
              'Some outputs were generated successfully, but others failed. See error messages for details.',
            type: 'warning',
            duration: 5000,
          })
        } else {
          toast({
            title: 'Processing failed',
            description: 'Failed to generate any outputs. Please try again.',
            type: 'error',
            duration: 7000,
          })
        }
      } catch (error) {
        console.error('Unexpected error in processMultipleOutputs:', error)

        // Handle any unexpected errors with atomic state cleanup
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred during processing'

        // Track error in PostHog
        analytics.trackError('generation_failed', errorMessage)

        // Ensure all processing states are cleared atomically
        setState((prev) => ({
          ...prev,
          isProcessing: {
            ...prev.isProcessing,
            mediumSummary: false,
            howToGuide: false,
          },
        }))

        toast({
          title: 'Processing failed',
          description: errorMessage,
          type: 'error',
          duration: 7000,
        })
      }
    },
    [toast]
  )

  return (
    <OutputContext.Provider
      value={{
        ...state,
        setActiveTab,
        processOutputType,
        processMultipleOutputs,
        updateEditedOutput,
        getOutputContent,
      }}
    >
      {children}
    </OutputContext.Provider>
  )
}

// Helper function to get the title for an output type
export function getOutputTypeTitle(type: OutputType): string {
  switch (type) {
    case 'shortSummary':
      return 'Short Summary'
    case 'mediumSummary':
      return 'Medium Summary'
    case 'howToGuide':
      return 'How-to Guide'
    default:
      return type
  }
}
