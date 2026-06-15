"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSession, type CandidateSession } from "@/lib/candidate-session"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, MapPin } from "lucide-react"
import { safeFormatDate } from "@/lib/date-utils"

interface EventItem {
  id: string; name: string; date: string; time: string; venue: string; status: string
}

export default function CandidateEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace("/candidate"); return }
    fetch(`/api/candidate/events?chestNo=${encodeURIComponent(s.chestNo)}`)
      .then(r => r.ok ? r.json() : [])
      .then(setEvents)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const statusOrder = { ongoing: 0, upcoming: 1, completed: 2 }
  const sorted = [...events].sort((a, b) => (statusOrder[a.status as keyof typeof statusOrder] ?? 3) - (statusOrder[b.status as keyof typeof statusOrder] ?? 3))

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">My Events</h1>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No events found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(ev => (
            <Card key={ev.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{ev.name}</h3>
                    <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                      {ev.date && (
                        <p className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {safeFormatDate(ev.date, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                          {ev.time ? ` at ${ev.time}` : ""}
                        </p>
                      )}
                      {ev.venue && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {ev.venue}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-3 ${
                    ev.status === "completed" ? "bg-emerald-500/10 text-emerald-500" :
                    ev.status === "ongoing" ? "bg-amber-500/10 text-amber-500 animate-pulse" :
                    "bg-blue-500/10 text-blue-500"
                  }`}>
                    {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
