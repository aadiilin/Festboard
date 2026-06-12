"use client"
import { Toaster } from "react-hot-toast"

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: { background: "hsl(var(--background))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" },
        success: { iconTheme: { primary: "#10B981", secondary: "white" } },
        error: { iconTheme: { primary: "#EF4444", secondary: "white" } },
      }}
    />
  )
}
