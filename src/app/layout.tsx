import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { ToastProvider } from "@/components/ui/toast"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FestBoard - Multi-Event Competition & Score Management",
  description: "Create and manage unlimited events, competitions, and scores from a single account.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  )
}
