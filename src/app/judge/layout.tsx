"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, hasRole } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !hasRole(profile, ["judge", "super_admin", "event_admin"])))
      router.push("/login")
  }, [user, profile, loading, router])

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  if (!user) return null

  return <div className="min-h-screen bg-background">{children}</div>
}
