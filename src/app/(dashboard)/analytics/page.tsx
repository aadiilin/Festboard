"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { BarChart3, Users, Trophy, Target, TrendingUp } from "lucide-react"
import type { Event } from "@/types"

export default function AnalyticsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [stats, setStats] = useState({
    participants: 0, competitions: 0, teams: 0, categories: 0,
    scores_approved: 0, scores_pending: 0, certificates: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
  }, [])

  useEffect(() => {
    if (selectedEvent) loadStats()
  }, [selectedEvent])

  const loadStats = async () => {
    const [participants, competitions, teams, categories, scores, certificates] = await Promise.all([
      supabase.from("participants").select("*", { count: "exact", head: true }).eq("event_id", selectedEvent),
      supabase.from("competitions").select("*", { count: "exact", head: true }).eq("event_id", selectedEvent),
      supabase.from("teams").select("*", { count: "exact", head: true }).eq("event_id", selectedEvent),
      supabase.from("categories").select("*", { count: "exact", head: true }).eq("event_id", selectedEvent),
      supabase.from("scores").select("*", { count: "exact", head: true }),
      supabase.from("certificates").select("*", { count: "exact", head: true }).eq("event_id", selectedEvent),
    ])
    setStats({
      participants: participants.count ?? 0,
      competitions: competitions.count ?? 0,
      teams: teams.count ?? 0,
      categories: categories.count ?? 0,
      scores_approved: 0,
      scores_pending: 0,
      certificates: certificates.count ?? 0,
    })
  }

  const cards = [
    { title: "Total Participants", value: stats.participants, icon: Users, color: "text-blue-500" },
    { title: "Competitions", value: stats.competitions, icon: Trophy, color: "text-amber-500" },
    { title: "Teams", value: stats.teams, icon: Target, color: "text-purple-500" },
    { title: "Categories", value: stats.categories, icon: BarChart3, color: "text-emerald-500" },
    { title: "Certificates", value: stats.certificates, icon: TrendingUp, color: "text-rose-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Analytics</h1><p className="text-muted-foreground">Event statistics and insights</p></div>
        <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs">
          <option value="">Select event</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </Select>
      </div>

      {!selectedEvent ? (
        <Card className="glass-card"><CardContent className="py-12 text-center text-muted-foreground">Select an event to view analytics.</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {cards.map(card => (
              <Card key={card.title} className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glass-card">
              <CardHeader><CardTitle>Participation Overview</CardTitle></CardHeader>
              <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                Chart visualization coming soon
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader><CardTitle>Team Scores Distribution</CardTitle></CardHeader>
              <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                Chart visualization coming soon
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
