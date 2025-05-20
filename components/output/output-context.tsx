"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { processOutput, type OutputType, type FileAttachment } from "@/app/actions"
import { analytics } from "@/lib/posthog"

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
    isRegeneration?: boolean,
  ) => Promise<void>
  processMultipleOutputs: (fileAttachments: FileAttachment[]) => Promise<void>
  updateEditedOutput: (outputType: OutputType, content: string) => void
  getOutputContent: (outputType: OutputType) => string
}

const OutputContext = createContext<OutputContextType | undefined>(undefined)

export function useOutput() {
  const context = useContext(OutputContext)
  if (context === undefined) {
    throw new Error("useOutput must be used within an OutputProvider")
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
      shortSummary: "",
      mediumSummary: "",
      howToGuide: "",
    },
    editedOutputs: {
      shortSummary: "",
      mediumSummary: "",
      howToGuide: "",
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
    activeTab: "shortSummary",
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

  const updateEditedOutput = useCallback((outputType: OutputType, content: string) => {
    setState((prev) => ({
      ...prev,
      editedOutputs: { ...prev.editedOutputs, [outputType]: content },
    }))
  }, [])

  const getOutputContent = useCallback(
    (outputType: OutputType) => {
      // Return edited content if it exists, otherwise return original output
      return state.editedOutputs[outputType] || state.outputs[outputType]
    },
    [state.editedOutputs, state.outputs],
  )

  const processOutputType = useCallback(
    async (outputType: OutputType, fileAttachments: FileAttachment[], isRegeneration = false) => {
      if (fileAttachments.length === 0) {
        analytics.trackError("no_files", "No files selected for processing")
        toast({
          title: "No files selected",
          description: "Please upload at least one file to process",
          type: "warning",
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
        const result = await processOutput(fileAttachments, outputType, isRegeneration)

        setState((prev) => ({
          ...prev,
          outputs: { ...prev.outputs, [outputType]: result },
          editedOutputs: { ...prev.editedOutputs, [outputType]: "" }, // Clear edited content
          isProcessing: { ...prev.isProcessing, [outputType]: false },
          retryCount: { ...prev.retryCount, [outputType]: 0 }, // Reset retry count on success
        }))

        toast({
          title: isRegeneration ? "Regeneration complete" : "Processing complete",
          description: `${getOutputTypeTitle(outputType)} has been ${isRegeneration ? "regenerated" : "generated"} successfully`,
          type: "success",
          duration: 3000,
        })
      } catch (error) {
        console.error(`Error processing ${outputType}:`, error)

        // Set the error message
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to ${isRegeneration ? "regenerate" : "generate"} ${getOutputTypeTitle(outputType)}. Please try again.`

        // Track error in PostHog
        analytics.trackError(
          isRegeneration ? "regeneration_failed" : "generation_failed",
          `${outputType}: ${errorMessage}`,
        )

        setState((prev) => ({
          ...prev,
          errors: { ...prev.errors, [outputType]: errorMessage },
          isProcessing: { ...prev.isProcessing, [outputType]: false },
        }))

        toast({
          title: "Processing failed",
          description: errorMessage,
          type: "error",
          duration: 7000,
        })
      }
    },
    [toast],
  )

  const processMultipleOutputs = useCallback(
    async (fileAttachments: FileAttachment[]) => {
      if (fileAttachments.length === 0) {
        analytics.trackError("no_files", "No files selected for processing")
        toast({
          title: "No files selected",
          description: "Please upload at least one file to process",
          type: "warning",
          duration: 3000,
        })
        return
      }

      // Track generation in PostHog
      analytics.trackOutputGeneration("multiple", false)

      // Clear any previous errors and set processing state
      setState((prev) => ({
        ...prev,
        errors: {
          shortSummary: null,
          mediumSummary: null,
          howToGuide: null,
        },
        isProcessing: {
          shortSummary: false,
          mediumSummary: true,
          howToGuide: true,
        },
      }))

      let mediumSuccess = false
      let howToSuccess = false

      try {
        // Process medium summary
        try {
          const mediumResult = await processOutput(fileAttachments, "mediumSummary", false)

          setState((prev) => ({
            ...prev,
            outputs: { ...prev.outputs, mediumSummary: mediumResult },
            editedOutputs: { ...prev.editedOutputs, mediumSummary: "" },
            isProcessing: { ...prev.isProcessing, mediumSummary: false },
            retryCount: { ...prev.retryCount, mediumSummary: 0 }, // Reset retry count on success
          }))

          mediumSuccess = true
        } catch (mediumError) {
          console.error("Error processing medium summary:", mediumError)

          setState((prev) => ({
            ...prev,
            errors: {
              ...prev.errors,
              mediumSummary: mediumError instanceof Error ? mediumError.message : "Failed to generate medium summary",
            },
            isProcessing: { ...prev.isProcessing, mediumSummary: false },
          }))
        }

        // Process how-to guide
        try {
          const howToResult = await processOutput(fileAttachments, "howToGuide", false)

          setState((prev) => ({
            ...prev,
            outputs: { ...prev.outputs, howToGuide: howToResult },
            editedOutputs: { ...prev.editedOutputs, howToGuide: "" },
            isProcessing: { ...prev.isProcessing, howToGuide: false },
            retryCount: { ...prev.retryCount, howToGuide: 0 }, // Reset retry count on success
          }))

          howToSuccess = true
        } catch (howToError) {
          console.error("Error processing how-to guide:", howToError)

          setState((prev) => ({
            ...prev,
            errors: {
              ...prev.errors,
              howToGuide: howToError instanceof Error ? howToError.message : "Failed to generate how-to guide",
            },
            isProcessing: { ...prev.isProcessing, howToGuide: false },
          }))
        }

        // Show appropriate toast based on results
        if (mediumSuccess && howToSuccess) {
          toast({
            title: "Processing complete",
            description: "All outputs have been generated successfully",
            type: "success",
            duration: 3000,
          })
        } else if (mediumSuccess || howToSuccess) {
          toast({
            title: "Partial success",
            description: "Some outputs were generated successfully, but others failed. See error messages for details.",
            type: "warning",
            duration: 5000,
          })
        } else {
          toast({
            title: "Processing failed",
            description: "Failed to generate any outputs. Please try again.",
            type: "error",
            duration: 7000,
          })
        }
      } catch (error) {
        console.error(`Error processing outputs:`, error)

        // This catch block handles any unexpected errors not caught by the inner try/catch blocks
        const errorMessage = error instanceof Error ? error.message : "Failed to generate outputs. Please try again."

        // Track error in PostHog
        analytics.trackError("generation_failed", errorMessage)

        setState((prev) => ({
          ...prev,
          isProcessing: {
            ...prev.isProcessing,
            mediumSummary: false,
            howToGuide: false,
          },
        }))

        toast({
          title: "Processing failed",
          description: errorMessage,
          type: "error",
          duration: 7000,
        })
      }
    },
    [toast],
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
    case "shortSummary":
      return "Short Summary"
    case "mediumSummary":
      return "Medium Summary"
    case "howToGuide":
      return "How-to Guide"
    default:
      return type
  }
}
