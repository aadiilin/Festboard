"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Trophy, Medal, Crown, TrendingUp } from "lucide-react"
import type { Event, Team, Score, Participant, Competition } from "@/types"

interface TeamScore {
  id: string
  name: string
  color: string
  total: number
  rank: number
}

export default function ScoreboardPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [teams, setTeams] = useState<TeamScore[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase.from("events").select("*").eq("status", "active").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
  }, [])

  useEffect(() => {
    if (selectedEvent) loadScores()
    const interval = setInterval(loadScores, 15000)
    return () => clearInterval(interval)
  }, [selectedEvent])

  const loadScores = async () => {
    const { data: teamsData } = await supabase.from("teams").select("*").eq("event_id", selectedEvent)
    if (!teamsData) return

    const { data: comps } = await supabase.from("competitions").select("*").eq("event_id", selectedEvent)
    if (!comps) return

    const teamScores: TeamScore[] = await Promise.all(
      teamsData.map(async (team) => {
        const { data: participants } = await supabase.from("participants").select("id").eq("team_id", team.id).eq("event_id", selectedEvent)
        if (!participants) return { id: team.id, name: team.name, color: team.color, total: 0, rank: 0 }

        const pIds = participants.map(p => p.id)
        let total = 0
        for (const comp of comps) {
          const { data: scores } = await supabase
            .from("scores")
            .select("marks")
            .in("participant_id", pIds)
            .eq("competition_id", comp.id)
            .eq("is_approved", true)
          if (scores) total += scores.reduce((sum, s) => sum + s.marks, 0)
        }
        return { id: team.id, name: team.name, color: team.color, total, rank: 0 }
      })
    )

    teamScores.sort((a, b) => b.total - a.total)
    teamScores.forEach((t, i) => (t.rank = i + 1))
    setTeams(teamScores)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Live Scoreboard</h1>
            </div>
            <p className="text-muted-foreground mt-1">Real-time team rankings</p>
          </div>
          <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs">
            <option value="">Select event</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </Select>
        </div>

        {!selectedEvent ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center text-muted-foreground">Select an event to view the scoreboard.</CardContent>
          </Card>
        ) : teams.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center text-muted-foreground">No teams found for this event.</CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {teams.map((team, index) => (
              <Card
                key={team.id}
                className={`glass-card overflow-hidden transition-all duration-500 animate-slide-up ${index === 0 ? "ring-2 ring-yellow-400" : ""}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold" style={{ color: team.color }}>
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${team.rank}`}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold" style={{ color: team.color }}>{team.name}</h2>
                        {index === 0 && <p className="text-sm text-yellow-500 font-medium flex items-center gap-1"><Crown className="h-4 w-4" /> Champion</p>}
                        {index === 1 && <p className="text-sm text-gray-400 font-medium flex items-center gap-1"><Medal className="h-4 w-4" /> Runner-up</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold tabular-nums score-update" key={team.total}>{team.total}</div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                        <TrendingUp className="h-3 w-3" /> points
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
