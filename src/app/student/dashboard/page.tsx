"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Search, Trophy, TrendingUp, Medal } from "lucide-react"
import type { Participant, Score, Team } from "@/types"

export default function StudentDashboardPage() {
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [scores, setScores] = useState<(Score & { comp_name?: string })[]>([])
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(false)

  const searchParticipant = async () => {
    if (!email.trim()) return
    setLoading(true)
    const { data } = await supabase.from("participants").select("*").eq("email", email).single()
    if (data) {
      setParticipant(data)
      if (data.team_id) {
        supabase.from("teams").select("*").eq("id", data.team_id).single().then(({ data: t }) => t && setTeam(t))
      }
      supabase
        .from("scores")
        .select("*, competition:competition_id(name)")
        .eq("participant_id", data.id)
        .eq("is_approved", true)
        .then(({ data: s }) => {
          if (s) setScores((s as any[]).map((d: any) => ({ ...d, comp_name: d.competition?.name })))
        })
    } else {
      setParticipant(null)
      setScores([])
      setTeam(null)
    }
    setLoading(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-3xl font-bold">Student Dashboard</h1><p className="text-muted-foreground">View your results by email</p></div>

      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="max-w-sm" />
            <Button onClick={searchParticipant} disabled={loading}><Search className="mr-2 h-4 w-4" />Search</Button>
          </div>
        </CardContent>
      </Card>

      {participant ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            Enter your email above to view your results.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
