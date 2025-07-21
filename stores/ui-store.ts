import { create } from 'zustand'

interface UIState {
  // Modal/Dialog states
  isWebReviewModalOpen: boolean

  // Loading overlays (separate from business logic loading)
  isGlobalLoading: boolean
  loadingMessage: string

  // Visual states
  isDragOverActive: boolean // different from file isDragging

  // Actions
  setWebReviewModal: (open: boolean) => void
  setGlobalLoading: (loading: boolean, message?: string) => void
  setDragOverActive: (active: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  isWebReviewModalOpen: false,
  isGlobalLoading: false,
  loadingMessage: '',
  isDragOverActive: false,

  setWebReviewModal: (open) => set({ isWebReviewModalOpen: open }),
  setGlobalLoading: (loading, message = '') =>
    set({ isGlobalLoading: loading, loadingMessage: message }),
  setDragOverActive: (active) => set({ isDragOverActive: active }),
}))
