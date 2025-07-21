import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FEATURE_FLAGS } from '@/lib/posthog'

interface FeatureState {
  // State
  overrideFlags: Record<string, boolean>

  // Actions
  setOverrideFlag: (flag: string, value: boolean) => void
  getFeatureFlag: (flag: string) => boolean
  resetOverrides: () => void
}

export const useFeatureStore = create<FeatureState>()(
  persist(
    (set, get) => ({
      // Initial state
      overrideFlags: {
        [FEATURE_FLAGS.IMAGE_UPLOAD]: false,
      },

      // Actions
      setOverrideFlag: (flag: string, value: boolean) => {
        set((state) => ({
          overrideFlags: {
            ...state.overrideFlags,
            [flag]: value,
          },
        }))
      },

      getFeatureFlag: (flag: string) => {
        const { overrideFlags } = get()

        // In development, check for overrides
        if (process.env.NODE_ENV === 'development') {
          if (flag in overrideFlags) {
            return overrideFlags[flag]
          }
        }

        // Default implementation (same as original)
        if (typeof window === 'undefined') return false

        // For this example, we'll default to false since we want to disable the feature
        // In a real implementation, you'd check PostHog here
        return false
      },

      resetOverrides: () => {
        set({
          overrideFlags: {
            [FEATURE_FLAGS.IMAGE_UPLOAD]: false,
          },
        })
      },
    }),
    {
      name: 'feature-flags-storage',
      partialize: (state) => ({ overrideFlags: state.overrideFlags }),
    }
  )
)

// Convenience hook for getting feature flags
export const useFeatureFlag = (flag: string): boolean => {
  return useFeatureStore((state) => state.getFeatureFlag(flag))
}

// Convenience hook for setting feature flags (development only)
export const useFeatureFlagOverride = () => {
  const setOverrideFlag = useFeatureStore((state) => state.setOverrideFlag)
  const overrideFlags = useFeatureStore((state) => state.overrideFlags)
  const resetOverrides = useFeatureStore((state) => state.resetOverrides)

  return {
    overrideFlags,
    setOverrideFlag,
    resetOverrides,
  }
}
