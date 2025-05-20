"use client"

import type React from "react"

import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"

// Initialize PostHog only in browser environments with a placeholder key
// This avoids exposing sensitive environment variables in the client
if (typeof window !== "undefined") {
  posthog.init("ph_placeholder_key", {
    api_host: "https://app.posthog.com",
    // Enable capturing by default
    capture_pageview: true,
    // Add more configuration as needed
  })
}

// Feature flags
export const FEATURE_FLAGS = {
  IMAGE_UPLOAD: "enable-image-upload",
}

// Hook to check if a feature is enabled
export function useFeatureFlag(flag: string): boolean {
  if (typeof window === "undefined") return false
  return posthog.isFeatureEnabled(flag)
}

// PostHog Provider Component
export function PHProvider({ children }: { children: React.ReactNode }) {
  if (typeof window === "undefined") return children
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}

// Analytics tracking helper functions
export const analytics = {
  // Track file uploads
  trackFileUpload: (fileCount: number) => {
    if (typeof window === "undefined") return
    posthog.capture("file_uploaded", {
      file_count: fileCount,
    })
  },

  // Track error messages
  trackError: (errorType: string, errorMessage: string) => {
    if (typeof window === "undefined") return
    posthog.capture("error_occurred", {
      error_type: errorType,
      error_message: errorMessage,
    })
  },

  // Track output type usage
  trackOutputGeneration: (outputType: string, isRegeneration: boolean) => {
    if (typeof window === "undefined") return
    posthog.capture("output_generated", {
      output_type: outputType,
      is_regeneration: isRegeneration,
    })
  },

  // Track downloads
  trackDownload: (outputType: string, fileFormat: string) => {
    if (typeof window === "undefined") return
    posthog.capture("content_downloaded", {
      output_type: outputType,
      file_format: fileFormat,
    })
  },

  // Track send button usage
  trackSend: (platform?: string) => {
    if (typeof window === "undefined") return
    posthog.capture("content_shared", {
      platform: platform || "email",
    })
  },

  // Track toast notifications
  trackToast: (toastType: string, toastTitle: string) => {
    if (typeof window === "undefined") return
    posthog.capture("toast_displayed", {
      toast_type: toastType,
      toast_title: toastTitle,
    })
  },
}
