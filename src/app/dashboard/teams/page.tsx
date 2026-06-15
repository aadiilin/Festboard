"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { Plus, Edit3, Trash2, Loader2, Users } from "lucide-react"
import toast from "react-hot-toast"
import type { Team, Event } from "@/types"

export default function TeamsPage() {
  const supabase = createClient()
  const [teams, setTeams] = useState<(Team & { event_name?: string })[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Team | null>(null)
  const [name, setName] = useState("")
  const [color, setColor] = useState("#6366f1")
  const [eventId, setEventId] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from("teams").select("*, events:event_id(name)").order("name"),
      supabase.from("events").select("*").order("name"),
    ]).then(([tRes, eRes]) => {
      if (tRes.data) setTeams(tRes.data.map((t: Record<string, unknown>) => ({ ...t as unknown as Team, event_name: (t.events as { name: string } | null)?.name ?? "" })))
      if (eRes.data) setEvents(eRes.data)
      setLoading(false)
    })
  }, [])

  const openAdd = () => { setEditing(null); setName(""); setColor("#6366f1"); setEventId(events[0]?.id ?? ""); setDialogOpen(true) }
  const openEdit = (t: Team & { event_name?: string }) => { setEditing(t); setName(t.name); setColor(t.color); setEventId(t.event_id); setDialogOpen(true) }

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required")
    setSaving(true)
    const payload = { name: name.trim(), color, event_id: eventId }
    if (editing) {
      const { error } = await supabase.from("teams").update(payload).eq("id", editing.id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success("Team updated")
    } else {
      const { error } = await supabase.from("teams").insert(payload)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success("Team created")
    }
    setDialogOpen(false); setSaving(false)
    const { data } = await supabase.from("teams").select("*, events:event_id(name)").order("name")
    if (data) setTeams(data.map((t: Record<string, unknown>) => ({ ...t as unknown as Team, event_name: (t.events as { name: string } | null)?.name ?? "" })))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold flex items-center gap-2"><Users className="h-7 w-7" /> Teams</h1><p className="text-muted-foreground">Manage teams for your events</p></div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Team</Button>
      </div>
      <Card className="glass-card">
        <CardContent className="pt-6">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          : teams.length === 0 ? <p className="text-muted-foreground text-center py-12">No teams yet.</p>
          : <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Color</TableHead><TableHead>Event</TableHead><TableHead className="w-24">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {teams.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell><div className="h-5 w-5 rounded-full border" style={{ backgroundColor: t.color }} /></TableCell>
                    <TableCell className="text-muted-foreground">{t.event_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit Team" : "Add Team"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name" /></div>
            <div><Label>Color</Label><Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10" /></div>
            <div><Label>Event</Label>
              <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
                <option value="">Select event</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </Select>
            </div>
            <Button onClick={save} disabled={saving} className="w-full">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Team</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete this team?</p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { await supabase.from("teams").delete().eq("id", deleteId); toast.success("Deleted"); setTeams(p => p.filter(x => x.id !== deleteId)); setDeleteId(null) }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
