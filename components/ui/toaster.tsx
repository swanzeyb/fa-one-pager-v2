"use client"

import { useToast } from "./use-toast"
import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type Toast = {
  id: number
  title?: string
  description?: string
  type?: "default" | "success" | "error" | "warning" | "info"
  duration: number
}

export function Toaster() {
  const { toast, dismiss } = useToast()
  const [toasts, setToasts] = useState<Toast[]>([])

  // This is a simplified implementation
  // In a real project, you would use the actual shadcn/ui Toaster component
  useEffect(() => {
    // This is just to make the component work in the example
    // In a real project, this would be handled by the shadcn/ui toast system
    const handleCustomEvent = (e: any) => {
      if (e.detail?.toast) {
        const newToast = {
          ...e.detail.toast,
          id: Date.now(),
          duration: e.detail.toast.duration || 5000, // Default to 5 seconds
        }

        setToasts((prev) => [...prev, newToast])

        // Set a timeout to remove the toast after the specified duration
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
        }, newToast.duration)
      }
    }

    window.addEventListener("toast", handleCustomEvent as any)
    return () => {
      window.removeEventListener("toast", handleCustomEvent as any)
    }
  }, [])

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4 w-full max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "p-4 rounded-md shadow-lg flex items-start justify-between animate-in slide-in-from-right-full duration-300",
            toast.type === "error" && "bg-red-100 text-red-800",
            toast.type === "success" && "bg-green-100 text-green-800",
            toast.type === "warning" && "bg-yellow-100 text-yellow-800",
            toast.type === "info" && "bg-blue-100 text-blue-800",
            toast.type === "default" || !toast.type ? "bg-white text-gray-800" : "",
          )}
        >
          <div>
            {toast.title && <h3 className="font-medium">{toast.title}</h3>}
            {toast.description && <p className="text-sm">{toast.description}</p>}
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
