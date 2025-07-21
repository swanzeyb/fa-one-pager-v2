/**
 * Transition bridge: Uses Zustand store but maintains React Context API
 * This allows gradual migration without breaking existing components
 * TODO: Remove this file once all components migrate to direct Zustand usage
 */
'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useFeatureStore } from '@/stores/feature-store'

// Simplified context that just exposes the Zustand store
type FeatureFlagContextType = {
  overrideFlags: Record<string, boolean>
  setOverrideFlag: (flag: string, value: boolean) => void
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(
  undefined
)

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  // Use Zustand store directly
  const overrideFlags = useFeatureStore((state) => state.overrideFlags)
  const setOverrideFlag = useFeatureStore((state) => state.setOverrideFlag)

  const value = {
    overrideFlags,
    setOverrideFlag,
  }

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

export function useFeatureFlagOverride() {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw new Error(
      'useFeatureFlagOverride must be used within a FeatureFlagProvider'
    )
  }
  return context
}

// This hook now uses Zustand directly
export function useFeatureFlag(flag: string): boolean {
  return useFeatureStore((state) => state.getFeatureFlag(flag))
}
