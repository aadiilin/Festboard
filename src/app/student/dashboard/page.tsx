"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { UserCircle, Trophy, Award, TrendingUp, Medal } from "lucide-react"
import type { Participant, Score, Competition, Team } from "@/types"

export default function StudentDashboardPage() {
  const { user, profile } = useAuth()
  const supabase = createClient()
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [scores, setScores] = useState<(Score & { comp_name?: string })[]>([])
  const [team, setTeam] = useState<Team | null>(null)

  useEffect(() => {
    if (user?.email) {
      supabase.from("participants").select("*").eq("email", user.email).single().then(({ data }) => {
        if (data) {
          setParticipant(data)
          if (data.team_id) {
            supabase.from("teams").select("*").eq("id", data.team_id).single().then(({ data: t }) => t && setTeam(t))
          }
        }
      })
    }
  }, [user])

  useEffect(() => {
    if (participant) {
      supabase
        .from("scores")
        .select("*, competition:competition_id(name)")
        .eq("participant_id", participant.id)
        .eq("is_approved", true)
        .returns<any>()
        .then(({ data }) => {
          if (data) setScores(data.map((d: any) => ({ ...d, comp_name: d.competition?.name })))
        })
    }
  }, [participant])

  if (!participant) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <UserCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Student Dashboard</h1>
        <p className="text-muted-foreground">Please login with your registered email to view your dashboard.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-3xl font-bold">My Dashboard</h1><p className="text-muted-foreground">Welcome, {participant.name}</p></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chest Number</CardTitle>
            <Medal className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold font-mono">{participant.chest_number}</div></CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team</CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: team?.color }}>{team?.name || "Unassigned"}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Competitions</CardTitle>
            <Trophy className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{scores.length}</div></CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scores.length > 0 ? (scores.reduce((a, s) => a + s.marks, 0) / scores.length).toFixed(1) : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>My Results</CardTitle></CardHeader>
        <CardContent>
          {scores.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No results available yet.</p>
          ) : (
            <div className="space-y-3">
              {scores.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{s.comp_name}</p>
                    <p className="text-sm text-muted-foreground">Score submitted</p>
                  </div>
                  <div className="text-2xl font-bold">{s.marks}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
