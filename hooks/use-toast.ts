"use client"

// This is a wrapper around the shadcn/ui toast hook to make it easier to use
// In a real project, you would import the actual hook from "@/components/ui/use-toast"

import { useToast as useShadcnToast } from "@/components/ui/use-toast"

export function useToast() {
  const { toast } = useShadcnToast()

  const showToast = (props: {
    title?: string
    description?: string
    type?: "default" | "success" | "error" | "warning"
    duration?: number
  }) => {
    // Set a default duration of 5 seconds if not specified
    const duration = props.duration ?? 5000

    // In a real project, this would directly call the shadcn/ui toast function
    // For this example, we'll dispatch a custom event to simulate the toast system
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: {
          toast: {
            ...props,
            duration,
          },
        },
      }),
    )
  }

  return { toast: showToast }
}
