"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, Clock } from "lucide-react"
import type { Event, Competition, Score } from "@/types"

export default function ScoresPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [scores, setScores] = useState<(Score & { participant_name?: string })[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [selectedComp, setSelectedComp] = useState("")
  const supabase = createClient()

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      supabase.from("competitions").select("*").eq("event_id", selectedEvent).then(({ data }) => data && setCompetitions(data))
    }
  }, [selectedEvent])

  useEffect(() => {
    if (selectedComp) loadScores()
  }, [selectedComp])

  const loadScores = async () => {
    const { data } = await supabase
      .from("scores")
      .select("*, participant:participant_id(name)")
      .eq("competition_id", selectedComp)
    if (data) {
      type ScoreRow = Score & { participant?: { name: string } | null }
      setScores(data.map((d: ScoreRow) => ({ ...d, participant_name: d.participant?.name })))
    }
  }

  const approveScore = async (id: string) => {
    await supabase.from("scores").update({ is_draft: false, is_approved: true }).eq("id", id)
    loadScores()
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Scores</h1><p className="text-muted-foreground">Review and approve scores</p></div>

      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4">
            <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs">
              <option value="">Select event</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </Select>
            <Select value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)} className="max-w-xs">
              <option value="">Select competition</option>
              {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>

          {!selectedComp ? (
            <p className="text-muted-foreground text-center py-8">Select a competition to view scores.</p>
          ) : scores.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No scores yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.participant_name}</TableCell>
                    <TableCell className="font-bold text-lg">{s.marks}</TableCell>
                    <TableCell>
                      {s.is_approved ? (
                        <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" /> Approved</Badge>
                      ) : (
                        <Badge variant="warning"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!s.is_approved && (
                        <Button size="sm" variant="outline" onClick={() => approveScore(s.id)}>Approve</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
