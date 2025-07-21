import { create } from 'zustand'
import type { FileAttachment, Step } from './types'
import * as fileService from '../services/file-service'
import * as analyticsService from '../services/analytics-service'
import { useToast } from '@/hooks/use-toast'

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
export type CoreStore = FileManagementSlice & StepTrackingSlice

export const useCoreStore = create<CoreStore>((set, get) => {
  // Toast must be called inside a React component, so we expose a helper
  // This workaround allows us to call toast from store actions
  let toastFn: ReturnType<typeof useToast>['toast'] | undefined
  const setToast = (fn: typeof toastFn) => {
    toastFn = fn
  }

  return {
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
