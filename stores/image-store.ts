import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ImageState {
  // State
  images: Record<string, string>

  // Actions
  addImage: (key: string, dataUrl: string) => void
  getImage: (key: string) => string | null
  getAllImages: () => Record<string, string>
  removeImage: (key: string) => void
  clearImages: () => void
}

export const useImageStore = create<ImageState>()(
  persist(
    (set, get) => ({
      // Initial state
      images: {},

      // Actions
      addImage: (key: string, dataUrl: string) => {
        set((state) => ({
          images: {
            ...state.images,
            [key]: dataUrl,
          },
        }))
      },

      getImage: (key: string) => {
        const { images } = get()
        return images[key] || null
      },

      getAllImages: () => {
        const { images } = get()
        return images
      },

      removeImage: (key: string) => {
        set((state) => {
          const newImages = { ...state.images }
          delete newImages[key]
          return { images: newImages }
        })
      },

      clearImages: () => {
        set({ images: {} })
      },
    }),
    {
      name: 'image-storage',
    }
  )
)
