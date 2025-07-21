import { create } from 'zustand'
import type { FileAttachment, Step } from './types'

interface FileManagementSlice {
  files: File[]
  fileAttachments: FileAttachment[]
  isDragging: boolean
  addFiles: (files: File[]) => Promise<void>
  removeFile: (index: number) => void
  setIsDragging: (isDragging: boolean) => void
}

interface StepTrackingSlice {
  currentStep: Step
  getCurrentStep: () => Step
  isStepComplete: (step: Step) => boolean
}

// Combine slices into a single store type
export type CoreStore = FileManagementSlice & StepTrackingSlice

export const useCoreStore = create<CoreStore>(() => ({
  // File Management Slice
  files: [],
  fileAttachments: [],
  isDragging: false,
  addFiles: async () => {},
  removeFile: () => {},
  setIsDragging: () => {},

  // Step Tracking Slice
  currentStep: 1,
  getCurrentStep: () => 1,
  isStepComplete: () => false,
}))
