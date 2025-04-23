"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { processOutput, type OutputType, type FileAttachment } from "@/app/actions"

interface OutputState {
  outputs: Record<OutputType, string>
  editedOutputs: Record<OutputType, string>
  isProcessing: Record<OutputType, boolean>
  errors: Record<OutputType, string | null>
  activeTab: OutputType
}

interface OutputContextType extends OutputState {
  setActiveTab: (tab: OutputType) => void
  processOutputType: (outputType: OutputType, fileAttachments: FileAttachment[]) => Promise<void>
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
  })

  const setActiveTab = useCallback((tab: OutputType) => {
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
    async (outputType: OutputType, fileAttachments: FileAttachment[]) => {
      if (fileAttachments.length === 0) {
        toast({
          title: "No files selected",
          description: "Please upload at least one file to process",
          type: "warning",
          duration: 3000,
        })
        return
      }

      // Clear any previous errors
      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, [outputType]: null },
        isProcessing: { ...prev.isProcessing, [outputType]: true },
      }))

      try {
        const result = await processOutput(fileAttachments, outputType)
        setState((prev) => ({
          ...prev,
          outputs: { ...prev.outputs, [outputType]: result },
          editedOutputs: { ...prev.editedOutputs, [outputType]: "" }, // Clear edited content
          isProcessing: { ...prev.isProcessing, [outputType]: false },
        }))

        toast({
          title: "Processing complete",
          description: `${getOutputTypeTitle(outputType)} has been generated successfully`,
          type: "success",
          duration: 3000,
        })
      } catch (error) {
        console.error(`Error processing ${outputType}:`, error)

        // Set the error message
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to generate ${getOutputTypeTitle(outputType)}. Please try again.`

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

  return (
    <OutputContext.Provider
      value={{
        ...state,
        setActiveTab,
        processOutputType,
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
