"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { FEATURE_FLAGS } from "@/lib/posthog"

// Create a context for overriding feature flags in development
type FeatureFlagContextType = {
  overrideFlags: Record<string, boolean>
  setOverrideFlag: (flag: string, value: boolean) => void
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined)

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [overrideFlags, setOverrideFlags] = useState<Record<string, boolean>>({
    // Default all flags to false in development
    [FEATURE_FLAGS.IMAGE_UPLOAD]: false,
  })

  const setOverrideFlag = (flag: string, value: boolean) => {
    setOverrideFlags((prev) => ({ ...prev, [flag]: value }))
    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem(`flag_override_${flag}`, value ? "true" : "false")
    }
  }

  // Load overrides from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const newOverrides = { ...overrideFlags }
      Object.keys(FEATURE_FLAGS).forEach((key) => {
        const flagKey = FEATURE_FLAGS[key as keyof typeof FEATURE_FLAGS]
        const storedValue = localStorage.getItem(`flag_override_${flagKey}`)
        if (storedValue !== null) {
          newOverrides[flagKey] = storedValue === "true"
        }
      })
      setOverrideFlags(newOverrides)
    }
  }, [])

  return (
    <FeatureFlagContext.Provider value={{ overrideFlags, setOverrideFlag }}>{children}</FeatureFlagContext.Provider>
  )
}

export function useFeatureFlagOverride() {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw new Error("useFeatureFlagOverride must be used within a FeatureFlagProvider")
  }
  return context
}

// Update our useFeatureFlag hook to check for overrides in development
export function useFeatureFlag(flag: string): boolean {
  const { overrideFlags } = useFeatureFlagOverride() || { overrideFlags: {} }

  // In development, check for overrides
  if (process.env.NODE_ENV === "development") {
    if (flag in overrideFlags) {
      return overrideFlags[flag]
    }
  }

  // Default implementation from posthog.ts
  if (typeof window === "undefined") return false

  // For this example, we'll default to false since we want to disable the feature
  // In a real implementation, you'd check PostHog here
  return false
}
