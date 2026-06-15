"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trophy, User, Hash, LogIn, Loader2, ScanLine } from "lucide-react"
import { setSession } from "@/lib/candidate-session"
import toast from "react-hot-toast"

export default function CandidateLoginPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [chestNo, setChestNo] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const chest = params.get("chest")
    if (chest) setChestNo(chest.toUpperCase())
  }, [])
  const [showScanner, setShowScanner] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogin = async () => {
    if (!name.trim() || !chestNo.trim()) {
      toast.error("Please enter your name and chest number")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/candidate/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), chestNo: chestNo.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Login failed")
        return
      }
      setSession({
        chestNo: data.chestNo,
        name: data.name,
        participantId: data.id,
        eventId: data.eventId,
        loggedIn: true,
      })
      router.push("/candidate/home")
    } catch {
      toast.error("Connection error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleLogin()
  }

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setShowScanner(false)
    setLoading(true)
    toast.success("QR scanning from image coming soon")
    setLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Candidate Portal</h1>
          <p className="text-sm text-muted-foreground">Sign in to view your profile, events, and results</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Your Name
            </label>
            <Input
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              Chest Number
            </label>
            <Input
              placeholder="e.g. JU002"
              value={chestNo}
              onChange={(e) => setChestNo(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              className="font-mono"
            />
          </div>

          <Button className="w-full h-11 text-base" onClick={handleLogin} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCameraCapture}
          />

          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => fileInputRef.current?.click()}
          >
            <ScanLine className="mr-2 h-5 w-5" />
            Scan QR Code
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to the terms and conditions of this event.
        </p>
      </div>
    </div>
  )
}
