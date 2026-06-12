"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import type { Event, Competition, Profile, CompetitionJudge } from "@/types"

export default function JudgesPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [judges, setJudges] = useState<Profile[]>([])
  const [assignedJudges, setAssignedJudges] = useState<(CompetitionJudge & { judge_name?: string; comp_name?: string })[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [selectedComp, setSelectedComp] = useState("")
  const [selectedJudge, setSelectedJudge] = useState("")
  const supabase = createClient()

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
    supabase.from("profiles").select("*").eq("role", "judge").then(({ data }) => data && setJudges(data))
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      supabase.from("competitions").select("*").eq("event_id", selectedEvent).then(({ data }) => data && setCompetitions(data))
      loadAssignments()
    }
  }, [selectedEvent])

  const loadAssignments = async () => {
    const { data } = await supabase
      .from("competition_judges")
      .select("*, judge:judge_id(full_name), competition:competition_id(name)")
      .returns<any>()
    if (data) setAssignedJudges(data.map((d: any) => ({ ...d, judge_name: d.judge?.full_name, comp_name: d.competition?.name })))
  }

  const assignJudge = async () => {
    if (!selectedComp || !selectedJudge) return toast.error("Select competition and judge")
    const { error } = await supabase.from("competition_judges").insert({ competition_id: selectedComp, judge_id: selectedJudge })
    if (error) toast.error(error.message)
    else { toast.success("Judge assigned"); loadAssignments() }
  }

  const removeAssignment = async (id: string) => {
    await supabase.from("competition_judges").delete().eq("id", id)
    toast.success("Removed"); loadAssignments()
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Judges</h1><p className="text-muted-foreground">Assign judges to competitions</p></div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Assign Judge</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs">
              <option value="">Select event</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </Select>
            <Select value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)} className="max-w-xs">
              <option value="">Select competition</option>
              {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select value={selectedJudge} onChange={(e) => setSelectedJudge(e.target.value)} className="max-w-xs">
              <option value="">Select judge</option>
              {judges.map(j => <option key={j.id} value={j.id}>{j.full_name}</option>)}
            </Select>
            <Button onClick={assignJudge}><Plus className="mr-1 h-4 w-4" />Assign</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="pt-6">
          {assignedJudges.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No assignments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Competition</TableHead><TableHead>Judge</TableHead><TableHead>Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {assignedJudges.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>{a.comp_name}</TableCell>
                    <TableCell>{a.judge_name}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => removeAssignment(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
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
