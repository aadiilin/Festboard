"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { QrCodeCard } from "@/components/qr/QrCodeCard"
import { Plus, Pencil, Trash2, Search, QrCode } from "lucide-react"
import { generateChestNumber, getCategoryPrefix } from "@/lib/utils"
import toast from "react-hot-toast"
import type { Event, Category, Team, Participant } from "@/types"

interface ParticipantForm {
  name: string; gender: string; category_id: string; team_id: string; mobile: string; email: string; address: string
}

export default function ParticipantsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Participant | null>(null)
  const [qrParticipant, setQrParticipant] = useState<Participant | null>(null)
  const [form, setForm] = useState<ParticipantForm>({ name: "", gender: "male", category_id: "", team_id: "", mobile: "", email: "", address: "" })
  const supabase = createClient()

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      loadCategories(); loadTeams(); loadParticipants()
    }
  }, [selectedEvent])

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").eq("event_id", selectedEvent)
    if (data) setCategories(data)
  }
  const loadTeams = async () => {
    const { data } = await supabase.from("teams").select("*").eq("event_id", selectedEvent)
    if (data) setTeams(data)
  }
  const loadParticipants = async () => {
    const { data } = await supabase.from("participants").select("*").eq("event_id", selectedEvent)
    if (data) setParticipants(data)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.category_id) return toast.error("Name and category required")
    const cat = categories.find(c => c.id === form.category_id)
    const prefix = cat ? getCategoryPrefix(cat.name) : "XX"
    const count = participants.filter(p => p.category_id === form.category_id).length
    const chest = generateChestNumber(prefix, count)

    const payload = {
      event_id: selectedEvent,
      chest_number: chest,
      name: form.name,
      gender: form.gender,
      category_id: form.category_id,
      team_id: form.team_id || null,
      mobile: form.mobile || null,
      email: form.email || null,
      address: form.address || null,
    }
    const { error } = editing
      ? await supabase.from("participants").update(payload).eq("id", editing.id)
      : await supabase.from("participants").insert(payload)

    if (error) toast.error(error.message)
    else {
      toast.success(editing ? "Updated" : "Added")
      setOpen(false); setEditing(null); setForm({ name: "", gender: "male", category_id: "", team_id: "", mobile: "", email: "", address: "" })
      loadParticipants()
    }
  }

  const deleteParticipant = async (id: string) => {
    if (!confirm("Delete?")) return
    await supabase.from("participants").delete().eq("id", id)
    toast.success("Deleted"); loadParticipants()
  }

  const filtered = participants.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.chest_number.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Participants</h1><p className="text-muted-foreground">Manage participants</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary"><Plus className="mr-2 h-4 w-4" />Add Participant</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Participant</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                <option value="">Select event</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </Select>
              <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                </Select>
                <Select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <Select value={form.team_id} onChange={(e) => setForm({ ...form, team_id: e.target.value })}>
                <option value="">No team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
              <Input placeholder="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <Button className="w-full" onClick={handleSubmit}>{editing ? "Save" : "Add Participant"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={!!qrParticipant} onOpenChange={(o) => { if (!o) setQrParticipant(null) }}>
          <DialogContent className="max-w-xs">
            <DialogHeader><DialogTitle>{qrParticipant?.name}</DialogTitle></DialogHeader>
            {qrParticipant && (
              <div className="flex flex-col items-center py-4">
                <QrCodeCard value={qrParticipant.chest_number} size={200} />
                <p className="text-sm text-muted-foreground mt-2">Chest: {qrParticipant.chest_number}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4">
            <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs">
              <option value="">Select event</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </Select>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name or chest number..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No participants found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">QR</TableHead>
                  <TableHead>Chest #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <QrCodeCard value={p.chest_number} size={48} />
                      <Button variant="ghost" size="icon" className="h-5 w-5 mt-1 mx-auto block" onClick={() => setQrParticipant(p)} title="View larger QR">
                        <QrCode className="h-3 w-3" />
                      </Button>
                    </TableCell>
                    <TableCell className="font-mono font-bold">{p.chest_number}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{categories.find(c => c.id === p.category_id)?.name}</TableCell>
                    <TableCell>{teams.find(t => t.id === p.team_id)?.name || "-"}</TableCell>
                    <TableCell className="capitalize">{p.gender}</TableCell>
                    <TableCell>{p.mobile || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setForm({ name: p.name, gender: p.gender, category_id: p.category_id, team_id: p.team_id || "", mobile: p.mobile || "", email: p.email || "", address: p.address || "" }); setOpen(true) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteParticipant(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
