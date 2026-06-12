"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Trophy, Medal, Crown } from "lucide-react"
import type { Event, Team, Score, Participant, Competition } from "@/types"

interface TeamScore {
  id: string
  name: string
  color: string
  total: number
  rank: number
}

export default function ProjectorPage() {
  const params = useParams()
  const supabase = createClient()
  const [event, setEvent] = useState<Event | null>(null)
  const [teams, setTeams] = useState<TeamScore[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [params.eventId])

  const loadData = async () => {
    const { data: ev } = await supabase.from("events").select("*").eq("id", params.eventId).single()
    if (ev) setEvent(ev)

    const { data: teamsData } = await supabase.from("teams").select("*").eq("event_id", params.eventId)
    if (!teamsData) return

    // Get all competitions for this event
    const { data: comps } = await supabase.from("competitions").select("*").eq("event_id", params.eventId)
    if (!comps) return

    // Calculate team scores
    const teamScores: TeamScore[] = await Promise.all(
      teamsData.map(async (team) => {
        const { data: participants } = await supabase.from("participants").select("id").eq("team_id", team.id).eq("event_id", params.eventId)
        if (!participants) return { id: team.id, name: team.name, color: team.color, total: 0, rank: 0 }

        const participantIds = participants.map(p => p.id)
        let total = 0
        for (const comp of comps) {
          const { data: scores } = await supabase
            .from("scores")
            .select("marks")
            .in("participant_id", participantIds)
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white projector-mode" onClick={toggleFullscreen}>
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="text-center mb-12">
          <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-6xl font-bold mb-2">{event?.name || "Loading..."}</h1>
          <p className="text-2xl text-gray-400">Live Scoreboard</p>
        </div>

        <div className="grid gap-6">
          {teams.map((team, index) => (
            <div
              key={team.id}
              className="glass rounded-2xl p-8 flex items-center justify-between score-card animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-8">
                <div className="text-6xl font-bold" style={{ color: team.color }}>
                  {team.rank === 1 ? "🥇" : team.rank === 2 ? "🥈" : team.rank === 3 ? "🥉" : `#${team.rank}`}
                </div>
                <div>
                  <h2 className="text-5xl font-bold" style={{ color: team.color }}>{team.name}</h2>
                  {team.rank === 1 && <p className="text-2xl text-yellow-400 mt-2">Champion</p>}
                  {team.rank === 2 && <p className="text-2xl text-gray-400 mt-2">Runner-up</p>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-7xl font-bold score-update" key={team.total}>{team.total}</div>
                <p className="text-xl text-gray-400">points</p>
              </div>
            </div>
          ))}
        </div>

        {!isFullscreen && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-gray-500 text-lg animate-pulse">
            Tap anywhere for fullscreen
          </div>
        )}
      </div>
    </div>
  )
}
