"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import type { Event, Team } from "@/types"

const TEAM_COLORS = ["#3B82F6", "#22C55E", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"]

export default function TeamsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [newTeam, setNewTeam] = useState({ name: "", color: TEAM_COLORS[0] })
  const supabase = createClient()

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
  }, [])

  useEffect(() => { if (selectedEvent) loadTeams() }, [selectedEvent])

  const loadTeams = async () => {
    const { data } = await supabase.from("teams").select("*").eq("event_id", selectedEvent)
    if (data) setTeams(data)
  }

  const addTeam = async () => {
    if (!newTeam.name.trim() || !selectedEvent) return
    const { error } = await supabase.from("teams").insert({
      event_id: selectedEvent, name: newTeam.name, color: newTeam.color,
    })
    if (error) toast.error(error.message)
    else { toast.success("Team added"); setNewTeam({ name: "", color: TEAM_COLORS[0] }); loadTeams() }
  }

  const deleteTeam = async (id: string) => {
    if (!confirm("Delete this team?")) return
    await supabase.from("teams").delete().eq("id", id)
    toast.success("Team deleted"); loadTeams()
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Teams</h1><p className="text-muted-foreground">Manage teams/houses</p></div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Add Team</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs">
              <option value="">Select event</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </Select>
            <Input placeholder="Team name (e.g., Green House)" value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} className="max-w-xs" />
            <div className="flex gap-1">
              {TEAM_COLORS.map(c => (
                <button key={c} onClick={() => setNewTeam({ ...newTeam, color: c })}
                  className={`w-6 h-6 rounded-full border-2 ${newTeam.color === c ? "border-foreground" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <Button onClick={addTeam}><Plus className="mr-1 h-4 w-4" />Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="pt-6">
          {teams.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No teams yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Color</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell><div className="w-6 h-6 rounded-full" style={{ backgroundColor: team.color }} /></TableCell>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteTeam(team.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
