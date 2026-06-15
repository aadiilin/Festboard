"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSession, type CandidateSession } from "@/lib/candidate-session"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarCheck, Award, QrCode, User, Trophy, MapPin, Clock, ExternalLink } from "lucide-react"
import toast from "react-hot-toast"
import { safeFormatDate } from "@/lib/date-utils"

interface Profile {
  name: string; chestNo: string; photoUrl?: string; gender: string; category: string; eventName: string; organization: string
}

interface EventItem {
  id: string; name: string; date: string; time: string; venue: string; status: string
}

interface ResultItem {
  competitionName: string; marks: number; maxMarks: number; position: string
}

export default function CandidateHomePage() {
  const router = useRouter()
  const [session, setSession] = useState<CandidateSession | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [results, setResults] = useState<ResultItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace("/candidate"); return }
    setSession(s)
    loadData(s)
  }, [])

  const loadData = async (s: CandidateSession) => {
    try {
      const [profRes, evRes, resRes] = await Promise.all([
        fetch(`/api/candidate/profile?chestNo=${encodeURIComponent(s.chestNo)}`),
        fetch(`/api/candidate/events?chestNo=${encodeURIComponent(s.chestNo)}`),
        fetch(`/api/candidate/results?chestNo=${encodeURIComponent(s.chestNo)}`),
      ])
      if (profRes.ok) setProfile(await profRes.json())
      if (evRes.ok) setEvents(await evRes.json())
      if (resRes.ok) setResults(await resRes.json())
    } catch {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const initials = profile?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"

  return (
    <div className="space-y-4 p-4 max-w-lg mx-auto">
      <Card className="glass-card overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <CardContent className="relative -mt-10 flex flex-col items-center text-center pb-4">
          <div className="h-20 w-20 rounded-full border-4 border-background bg-muted flex items-center justify-center text-2xl font-bold shadow-md overflow-hidden">
            {profile?.photoUrl ? (
              <img src={profile.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <h2 className="text-lg font-bold mt-2">{profile?.name || session.name}</h2>
          <p className="text-sm font-mono font-bold text-primary">{session.chestNo}</p>
          <p className="text-xs text-muted-foreground mt-1">{profile?.category}{profile?.organization ? ` · ${profile.organization}` : ""}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="glass-card cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push("/candidate/events")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{events.length}</p>
              <p className="text-xs text-muted-foreground">Events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push("/candidate/results")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{results.length}</p>
              <p className="text-xs text-muted-foreground">Results</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {events.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Upcoming Events</h3>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push("/candidate/events")}>
              View All <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {events.slice(0, 3).map(ev => (
              <Card key={ev.id} className="glass-card">
                <CardContent className="p-3 flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    ev.status === "completed" ? "bg-emerald-500/10 text-emerald-500" :
                    ev.status === "ongoing" ? "bg-amber-500/10 text-amber-500" :
                    "bg-blue-500/10 text-blue-500"
                  }`}>
                    {ev.status === "completed" ? "C" : ev.status === "ongoing" ? "O" : "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{ev.name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      {safeFormatDate(ev.date) && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{safeFormatDate(ev.date)}</span>}
                      {ev.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.venue}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Recent Results</h3>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push("/candidate/results")}>
              View All <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {results.slice(0, 3).map((r, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    r.position === "1st" ? "bg-amber-500/10 text-amber-500" :
                    r.position === "2nd" ? "bg-gray-400/10 text-gray-400" :
                    r.position === "3rd" ? "bg-orange-600/10 text-orange-600" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {r.position === "1st" ? "1" : r.position === "2nd" ? "2" : r.position === "3rd" ? "3" : "P"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.competitionName}</p>
                    <p className="text-xs text-muted-foreground">{r.marks}/{r.maxMarks} marks · {r.position}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="glass-card cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push("/candidate/qr")}>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">My QR Code</p>
            <p className="text-xs text-muted-foreground">Show this at events for check-in</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
