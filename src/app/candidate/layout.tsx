"use client"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getSession, clearSession, type CandidateSession } from "@/lib/candidate-session"
import { Home, CalendarCheck, Award, QrCode, LogOut, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

const tabs = [
  { path: "/candidate/home", label: "Home", icon: Home },
  { path: "/candidate/events", label: "Events", icon: CalendarCheck },
  { path: "/candidate/results", label: "Results", icon: Award },
  { path: "/candidate/qr", label: "My QR", icon: QrCode },
]

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<CandidateSession | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const s = getSession()
    setSession(s)
    setChecked(true)
    if (!s && pathname !== "/candidate") router.replace("/candidate")
  }, [])

  const isLoginPage = pathname === "/candidate"

  if (isLoginPage) return <>{children}</>

  if (!checked || !session) return null

  const handleLogout = () => {
    clearSession()
    router.replace("/candidate")
  }

  if (isLoginPage) return <>{children}</>

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-bold">FestBoard</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">{session.name}</span>
          <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{session.chestNo}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout} title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 pb-16">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t">
        <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = pathname.startsWith(tab.path)
            return (
              <button
                key={tab.path}
                onClick={() => router.push(tab.path)}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
