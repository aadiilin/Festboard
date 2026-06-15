"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Gavel, LogIn } from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

export default function JudgeLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("festboard_judge")
    if (stored) router.replace("/judge/dashboard")
  }, [])

  const handleLogin = async () => {
    if (!email || !password) return toast.error("Email and password are required")
    setLoading(true)
    const res = await fetch("/api/judge/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setLoading(false); return }
    localStorage.setItem("festboard_judge", JSON.stringify(data.user))
    toast.success("Welcome back!")
    router.push("/judge/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Gavel className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Judge Login</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Sign in to access your scoring dashboard</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="jemail">Email</Label>
            <Input id="jemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="judge@example.com" />
          </div>
          <div>
            <Label htmlFor="jpass">Password</Label>
            <Input id="jpass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
          </div>
          <Button onClick={handleLogin} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            {loading ? "Signing in..." : "Login as Judge"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
