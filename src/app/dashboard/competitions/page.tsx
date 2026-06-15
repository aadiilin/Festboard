"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, Search } from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils"
import toast from "react-hot-toast"
import type { Event, Category, Competition } from "@/types"

export default function CompetitionsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "", category_id: "", venue: "", date: "", time: "", max_marks: 100, instructions: "", status: "upcoming" as Competition["status"],
  })
  const supabase = createClient()

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      supabase.from("categories").select("*").eq("event_id", selectedEvent).then(({ data }) => data && setCategories(data))
      loadCompetitions()
    }
  }, [selectedEvent])

  const loadCompetitions = async () => {
    const { data } = await supabase.from("competitions").select("*").eq("event_id", selectedEvent)
    if (data) setCompetitions(data)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.category_id || !form.date || !form.time) return toast.error("Fill required fields")
    const payload = { event_id: selectedEvent, ...form, max_marks: Number(form.max_marks) }
    const { error } = await supabase.from("competitions").insert(payload)
    if (error) toast.error(error.message)
    else { toast.success("Competition created"); setOpen(false); setForm({ name: "", category_id: "", venue: "", date: "", time: "", max_marks: 100, instructions: "", status: "upcoming" }); loadCompetitions() }
  }

  const deleteComp = async (id: string) => {
    if (!confirm("Delete?")) return
    const { error } = await supabase.from("competitions").delete().eq("id", id)
    if (error) toast.error(error.message)
    else { toast.success("Deleted"); loadCompetitions() }
  }

  const statusVariant: Record<Competition["status"], "default" | "success" | "warning"> = { upcoming: "default", ongoing: "warning", completed: "success" }
  const filtered = competitions.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Competitions</h1><p className="text-muted-foreground">Create and manage competitions</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary"><Plus className="mr-2 h-4 w-4" />Add Competition</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Competition</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Competition name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Input type="number" placeholder="Max marks" value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: Number(e.target.value) })} />
              </div>
              <Input placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
              <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none" placeholder="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
              <Button className="w-full" onClick={handleSubmit}>Create Competition</Button>
            </div>
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
              <Input placeholder="Search competitions..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No competitions found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Max Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{categories.find(cat => cat.id === c.category_id)?.name}</TableCell>
                    <TableCell>{formatDate(c.date)} {formatTime(c.time)}</TableCell>
                    <TableCell>{c.venue || "-"}</TableCell>
                    <TableCell>{c.max_marks}</TableCell>
                    <TableCell><Badge variant={statusVariant[c.status]}>{c.status}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteComp(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
