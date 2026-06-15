"use client"
import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Trophy, CheckCircle, Lock, Unlock } from "lucide-react"
import toast from "react-hot-toast"
import type { Event, Competition, Participant, Score } from "@/types"

export default function ScoresPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [scores, setScores] = useState<(Score & { pname?: string; chest?: string; cname?: string })[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [selectedComp, setSelectedComp] = useState("")
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
  }, [])

  useEffect(() => {
    if (!selectedEvent) return
    setLoading(true)
    Promise.all([
      supabase.from("competitions").select("*").eq("event_id", selectedEvent),
      supabase.from("participants").select("*").eq("event_id", selectedEvent),
    ]).then(([cRes, pRes]) => {
      if (cRes.data) { setCompetitions(cRes.data); if (cRes.data[0] && !selectedComp) setSelectedComp(cRes.data[0].id) }
      if (pRes.data) setParticipants(pRes.data)
      setLoading(false)
    })
  }, [selectedEvent])

  useEffect(() => {
    if (!selectedComp) return
    supabase.from("scores").select("*, participants:participant_id(name, chest_number), competitions:competition_id(name)").eq("competition_id", selectedComp).then(({ data }) => {
      if (data) setScores(data.map((s: Record<string, unknown>) => ({
        ...s as unknown as Score,
        pname: (s.participants as { name: string } | null)?.name ?? "",
        chest: (s.participants as { chest_number: string } | null)?.chest_number ?? "",
        cname: (s.competitions as { name: string } | null)?.name ?? "",
      })))
    })
  }, [selectedComp])

  const submitScore = async (pId: string) => {
    if (!selectedComp) return
    const marks = parseFloat(scoreInputs[pId])
    if (isNaN(marks)) return toast.error("Enter a valid score")
    setSubmitting(prev => ({ ...prev, [pId]: true }))
    const res = await fetch("/api/judge/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competition_id: selectedComp, participant_id: pId, marks }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setSubmitting(prev => ({ ...prev, [pId]: false })); return }
    toast.success("Score saved")
    setScoreInputs(prev => { const n = { ...prev }; delete n[pId]; return n })
    const { data: updated } = await supabase.from("scores").select("*, participants:participant_id(name, chest_number), competitions:competition_id(name)").eq("competition_id", selectedComp)
    if (updated) setScores(updated.map((s: Record<string, unknown>) => ({ ...s as unknown as Score, pname: (s.participants as { name: string } | null)?.name ?? "", chest: (s.participants as { chest_number: string } | null)?.chest_number ?? "", cname: (s.competitions as { name: string } | null)?.name ?? "" })))
    setSubmitting(prev => ({ ...prev, [pId]: false }))
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold flex items-center gap-2"><Trophy className="h-7 w-7" /> Scores</h1><p className="text-muted-foreground">Enter and manage scores for competitions</p></div>

      <div className="flex gap-3 flex-wrap items-center">
        <div><Label className="text-xs mb-1 block">Event</Label>
          <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="w-52">
            <option value="">Select event</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </Select>
        </div>
        <div><Label className="text-xs mb-1 block">Competition</Label>
          <Select value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)} className="w-52">
            <option value="">Select competition</option>
            {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="pt-6">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          : !selectedComp ? <p className="text-muted-foreground text-center py-8">Select an event and competition.</p>
          : participants.length === 0 ? <p className="text-muted-foreground text-center py-8">No participants in this event.</p>
          : <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chest No</TableHead><TableHead>Participant</TableHead>
                    <TableHead className="w-24">Score</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map(p => {
                    const existing = scores.find(s => s.participant_id === p.id)
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono">{p.chest_number}</TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>
                          <Input type="number" min={0} step={0.1} placeholder={existing?.marks?.toString() ?? "0"}
                            value={scoreInputs[p.id] ?? ""}
                            onChange={(e) => setScoreInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                            className="h-8 w-20" />
                        </TableCell>
                        <TableCell>
                          {existing ? <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> {existing.marks}</Badge> : <Badge variant="secondary">Pending</Badge>}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => submitScore(p.id)} disabled={submitting[p.id] || !scoreInputs[p.id]}>
                            {submitting[p.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : "Submit"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>}
        </CardContent>
      </Card>

      {scores.length > 0 && (
        <Card className="glass-card">
          <CardHeader><CardTitle>Submitted Scores</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Participant</TableHead><TableHead>Chest</TableHead><TableHead>Competition</TableHead><TableHead>Marks</TableHead><TableHead>Approved</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {scores.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.pname}</TableCell>
                    <TableCell className="font-mono">{s.chest}</TableCell>
                    <TableCell className="text-muted-foreground">{s.cname}</TableCell>
                    <TableCell><Badge variant="success">{s.marks}</Badge></TableCell>
                    <TableCell>{s.is_approved ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Badge variant="secondary">Pending</Badge>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
