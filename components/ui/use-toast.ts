"use client"

// This is a placeholder for the actual shadcn/ui toast hook
// In a real project, this would be imported from "@/components/ui/use-toast"
// But for this example, I'll create a simplified version

import { useState } from "react"

export type ToastProps = {
  title?: string
  description?: string
  type?: "default" | "success" | "error" | "warning"
  duration?: number
}

export type Toast = ToastProps & {
  id: string
}

type ToastActionType = {
  toast: (props: ToastProps) => void
  dismiss: (id: string) => void
}

export const useToast = (): ToastActionType => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...props, id }
    setToasts((prev) => [...prev, newToast])

    if (props.duration !== Number.POSITIVE_INFINITY) {
      setTimeout(() => {
        dismiss(id)
      }, props.duration || 5000)
    }
  }

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return { toast, dismiss }
}
