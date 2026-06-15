import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = { title: "Offline - FestBoard" }

export default function OfflinePage() {
  return (
    <html lang="en">
      <body className={`${inter.className} flex items-center justify-center min-h-screen bg-background text-foreground p-4`}>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">📡</div>
          <h1 className="text-2xl font-bold mb-2">You&apos;re Offline</h1>
          <p className="text-muted-foreground mb-6">Connect to the internet to use FestBoard.</p>
          <div className="w-12 h-1 bg-primary rounded-full mx-auto opacity-50" />
        </div>
      </body>
    </html>
  )
}
