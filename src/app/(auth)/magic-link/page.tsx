"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { Mail, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

export default function MagicLinkPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { signInWithMagicLink } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const error = await signInWithMagicLink(email)
    setLoading(false)
    if (error) toast.error(error)
    else setSent(true)
  }

  if (sent) {
    return (
      <Card className="glass-card">
        <CardHeader className="text-center">
          <Mail className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>A magic link has been sent to {email}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">Back to login</Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader className="text-center">
        <Mail className="mx-auto h-8 w-8 text-primary mb-2" />
        <CardTitle className="text-2xl">Magic Link</CardTitle>
        <CardDescription>Get a sign-in link sent to your email</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Send Magic Link
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
