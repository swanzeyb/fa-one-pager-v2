import { create } from 'zustand'
import type { FileAttachment, Step } from './types'
import type { OutputType } from '@/app/actions'
import * as fileService from '../services/file-service'
import * as analyticsService from '../services/analytics-service'
import * as aiService from '../services/ai-service'
import { useToast } from '@/hooks/use-toast'

interface OutputSlice {
  outputs: Record<OutputType, string>
  editedOutputs: Record<OutputType, string>
  isProcessing: Record<OutputType, boolean>
  errors: Record<OutputType, string | null>
  activeTab: OutputType
  retryCount: Record<OutputType, number>
  processOutputType: (
    type: OutputType,
    isRegeneration?: boolean
  ) => Promise<void>
  processMultipleOutputs: () => Promise<void>
  updateEditedOutput: (type: OutputType, content: string) => void
  setActiveTab: (tab: OutputType) => void
}

interface FileManagementSlice {
  files: File[]
  fileAttachments: FileAttachment[]
  isDragging: boolean
  addFiles: (files: File[]) => Promise<void>
  removeFile: (index: number) => void
  setIsDragging: (isDragging: boolean) => void
  setToast: (fn: ReturnType<typeof useToast>['toast']) => void
}

interface StepTrackingSlice {
  currentStep: Step
  getCurrentStep: () => Step
  isStepComplete: (step: Step) => boolean
}

// Combine slices into a single store type
export type CoreStore = FileManagementSlice & StepTrackingSlice & OutputSlice

export const useCoreStore = create<CoreStore>((set, get) => {
  // Toast must be called inside a React component, so we expose a helper
  // This workaround allows us to call toast from store actions
  let toastFn: ReturnType<typeof useToast>['toast'] | undefined
  const setToast = (fn: typeof toastFn) => {
    toastFn = fn
  }

  return {
    // Output Management Slice
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
    setActiveTab: (tab: OutputType) => {
      analyticsService.trackOutputGeneration(tab, false)
      set({ activeTab: tab })
    },
    updateEditedOutput: (type: OutputType, content: string) => {
      set((state) => ({
        editedOutputs: { ...state.editedOutputs, [type]: content },
      }))
    },
    processOutputType: async (type: OutputType, isRegeneration = false) => {
      const { fileAttachments } = get()
      if (!fileAttachments.length) {
        analyticsService.trackError(
          'no_files',
          'No files selected for processing'
        )
        if (toastFn) {
          toastFn({
            title: 'No files selected',
            description: 'Please upload at least one file to process',
            type: 'warning',
            duration: 3000,
          })
        }
        return
      }
      analyticsService.trackOutputGeneration(type, isRegeneration)
      set((state) => ({
        errors: { ...state.errors, [type]: null },
        isProcessing: { ...state.isProcessing, [type]: true },
      }))
      try {
        const result = await aiService.processOutput(fileAttachments, type)
        set((state) => ({
          outputs: { ...state.outputs, [type]: result },
          editedOutputs: { ...state.editedOutputs, [type]: '' },
          isProcessing: { ...state.isProcessing, [type]: false },
          retryCount: { ...state.retryCount, [type]: 0 },
        }))
        if (toastFn) {
          toastFn({
            title: isRegeneration
              ? 'Regeneration complete'
              : 'Processing complete',
            description: `${type} has been ${
              isRegeneration ? 'regenerated' : 'generated'
            } successfully`,
            type: 'success',
            duration: 3000,
          })
        }
      } catch (error: any) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to ${
                isRegeneration ? 'regenerate' : 'generate'
              } ${type}. Please try again.`
        analyticsService.trackError(
          isRegeneration ? 'regeneration_failed' : 'generation_failed',
          `${type}: ${errorMessage}`
        )
        set((state) => ({
          errors: { ...state.errors, [type]: errorMessage },
          isProcessing: { ...state.isProcessing, [type]: false },
          retryCount: {
            ...state.retryCount,
            [type]: state.retryCount[type] + 1,
          },
        }))
        if (toastFn) {
          toastFn({
            title: 'Processing failed',
            description: errorMessage,
            type: 'error',
            duration: 7000,
          })
        }
      }
    },
    processMultipleOutputs: async () => {
      const { fileAttachments } = get()
      if (!fileAttachments.length) {
        analyticsService.trackError(
          'no_files',
          'No files selected for processing'
        )
        if (toastFn) {
          toastFn({
            title: 'No files selected',
            description: 'Please upload at least one file to process',
            type: 'warning',
            duration: 3000,
          })
        }
        return
      }
      analyticsService.trackOutputGeneration('multiple', false)
      set((state) => ({
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
        try {
          const mediumResult = await aiService.processOutput(
            fileAttachments,
            'mediumSummary'
          )
          set((state) => ({
            outputs: { ...state.outputs, mediumSummary: mediumResult },
            editedOutputs: { ...state.editedOutputs, mediumSummary: '' },
            isProcessing: { ...state.isProcessing, mediumSummary: false },
            retryCount: { ...state.retryCount, mediumSummary: 0 },
          }))
          mediumSuccess = true
        } catch (mediumError: any) {
          set((state) => ({
            errors: {
              ...state.errors,
              mediumSummary:
                mediumError instanceof Error
                  ? mediumError.message
                  : 'Failed to generate medium summary',
            },
            isProcessing: { ...state.isProcessing, mediumSummary: false },
            retryCount: {
              ...state.retryCount,
              mediumSummary: state.retryCount.mediumSummary + 1,
            },
          }))
        }
        try {
          const howToResult = await aiService.processOutput(
            fileAttachments,
            'howToGuide'
          )
          set((state) => ({
            outputs: { ...state.outputs, howToGuide: howToResult },
            editedOutputs: { ...state.editedOutputs, howToGuide: '' },
            isProcessing: { ...state.isProcessing, howToGuide: false },
            retryCount: { ...state.retryCount, howToGuide: 0 },
          }))
          howToSuccess = true
        } catch (howToError: any) {
          set((state) => ({
            errors: {
              ...state.errors,
              howToGuide:
                howToError instanceof Error
                  ? howToError.message
                  : 'Failed to generate how-to guide',
            },
            isProcessing: { ...state.isProcessing, howToGuide: false },
            retryCount: {
              ...state.retryCount,
              howToGuide: state.retryCount.howToGuide + 1,
            },
          }))
        }
        if (toastFn) {
          if (mediumSuccess && howToSuccess) {
            toastFn({
              title: 'Processing complete',
              description: 'All outputs have been generated successfully',
              type: 'success',
              duration: 3000,
            })
          } else if (mediumSuccess || howToSuccess) {
            toastFn({
              title: 'Partial success',
              description:
                'Some outputs were generated successfully, but others failed. See error messages for details.',
              type: 'warning',
              duration: 5000,
            })
          } else {
            toastFn({
              title: 'Processing failed',
              description: 'Failed to generate any outputs. Please try again.',
              type: 'error',
              duration: 7000,
            })
          }
        }
      } catch (error: any) {
        analyticsService.trackError(
          'generation_failed',
          error instanceof Error ? error.message : 'Failed to generate outputs'
        )
        set((state) => ({
          isProcessing: {
            ...state.isProcessing,
            mediumSummary: false,
            howToGuide: false,
          },
        }))
        if (toastFn) {
          toastFn({
            title: 'Processing failed',
            description:
              error instanceof Error
                ? error.message
                : 'Failed to generate outputs. Please try again.',
            type: 'error',
            duration: 7000,
          })
        }
      }
    },
    // File Management Slice
    files: [],
    fileAttachments: [],
    isDragging: false,
    addFiles: async (newFiles: File[]) => {
      // Validate file types
      const { valid, invalid } = fileService.validateFileTypes(newFiles)
      if (invalid.length > 0 && toastFn) {
        const fileNames = invalid.map((f) => f.name).join(', ')
        const errorMessage = `Unsupported file type${
          invalid.length > 1 ? 's' : ''
        }: ${fileNames}. Only PDF, TXT, DOCX, PNG, JPG, JPEG, SVG files are supported.`
        analyticsService.trackError('invalid_file_type', errorMessage)
        toastFn({
          title: 'Invalid file type',
          description: errorMessage,
          type: 'error',
          duration: 5000,
        })
      }
      if (valid.length === 0) return
      set((state) => ({ files: [...state.files, ...valid] }))
      analyticsService.trackFileUpload(valid.length)
      try {
        const newAttachments = await fileService.prepareFileAttachments(valid)
        set((state) => ({
          fileAttachments: [...state.fileAttachments, ...newAttachments],
        }))
      } catch (error: any) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to prepare files for processing'
        analyticsService.trackError('file_processing', errorMessage)
        if (toastFn) {
          toastFn({
            title: 'Error preparing files',
            description: errorMessage,
            type: 'error',
            duration: 5000,
          })
        }
      }
    },
    removeFile: (index: number) => {
      set((state) => ({
        files: state.files.filter((_, i) => i !== index),
        fileAttachments: state.fileAttachments.filter((_, i) => i !== index),
      }))
    },
    setIsDragging: (isDragging: boolean) => set({ isDragging }),

    // Step Tracking Slice
    currentStep: 1,
    getCurrentStep: () => {
      const { files } = get()
      // outputs will be added to store later, for now just check files
      // If no files, step 1
      if (!files.length) return 1 as Step
      // If files exist, but no outputs, step 2 (outputs logic to be added)
      // Placeholder for outputs logic:
      // const outputs = get().outputs
      // if (!outputs.mediumSummary && !outputs.howToGuide) return 2
      return 2 as Step
    },
    isStepComplete: (step: Step) => {
      // Placeholder logic
      const { files } = get()
      if (step === 1) return files.length > 0
      // outputs logic to be added
      return false
    },
    setToast,
  }
})
