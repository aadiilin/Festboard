"use client"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCodeCard } from "@/components/qr/QrCodeCard"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, Pencil, Eye, Search, Trophy, Calendar, MapPin, Users, Loader2, AlertCircle, X } from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils"
import toast from "react-hot-toast"
import type { Event, Competition, Category, Participant, Score } from "@/types"

type Tab = "overview" | "events" | "participants" | "results"
type StatusFilter = "all" | Competition["status"]

const statusVariant: Record<Competition["status"], "default" | "success" | "warning"> = {
  upcoming: "default", ongoing: "warning", completed: "success",
}

interface CompForm {
  name: string; event_id: string; category_id: string; venue: string; date: string; time: string; max_marks: number; instructions: string; status: Competition["status"]
}

const emptyForm: CompForm = {
  name: "", event_id: "", category_id: "", venue: "", date: "", time: "", max_marks: 100, instructions: "", status: "upcoming",
}

export default function CompetitionsPage() {
  const supabase = createClient()

  // List state
  const [events, setEvents] = useState<Event[]>([])
  const [allComps, setAllComps] = useState<(Competition & { event_name?: string; category_name?: string; participant_count?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  // Form modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Competition | null>(null)
  const [form, setForm] = useState<CompForm>(emptyForm)
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)

  // Detail view state
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null)
  const [detailTab, setDetailTab] = useState<Tab>("overview")
  const [compParticipants, setCompParticipants] = useState<Participant[]>([])
  const [compScores, setCompScores] = useState<(Score & { participant_name?: string })[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  // --- Load events & competitions ---
  const loadData = useCallback(async () => {
    setLoading(true)
    setError("")
    const { data: evData, error: evErr } = await supabase.from("events").select("*").order("created_at", { ascending: false })
    if (evErr) { setError(evErr.message); setLoading(false); return }

    setEvents(evData || [])
    const firstEv = evData?.[0]?.id

    const { data: compData, error: compErr } = await supabase
      .from("competitions")
      .select("*, event:event_id(name), category:category_id(name)")
      .order("date", { ascending: false })
    if (compErr) { setError(compErr.message); setLoading(false); return }

    // Count participants per category
    const { data: catParts } = await supabase.from("participants").select("category_id")
    const partCount: Record<string, number> = {}
    if (catParts) catParts.forEach(p => { partCount[p.category_id] = (partCount[p.category_id] || 0) + 1 })

    setAllComps((compData || []).map(c => {
      const cRow = c as any
      return {
        ...c,
        event_name: cRow.event?.name,
        category_name: cRow.category?.name,
        participant_count: partCount[c.category_id] || 0,
      }
    }))

    if (firstEv && !form.event_id) setForm(f => ({ ...f, event_id: firstEv }))
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [])

  // --- Load categories when event changes ---
  useEffect(() => {
    if (form.event_id) {
      supabase.from("categories").select("*").eq("event_id", form.event_id).then(({ data }) => data && setCategories(data))
    }
  }, [form.event_id])

  // --- Create / Update ---
  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error("Name is required")
    if (!form.event_id) return toast.error("Select an event")
    if (!form.category_id) return toast.error("Select a category")
    if (!form.date) return toast.error("Date is required")
    if (!form.time) return toast.error("Time is required")

    setSaving(true)
    const payload = {
      event_id: form.event_id,
      category_id: form.category_id,
      name: form.name.trim(),
      venue: form.venue || null,
      date: form.date,
      time: form.time,
      max_marks: Number(form.max_marks),
      instructions: form.instructions || null,
      status: form.status,
    }

    const { error: err } = editing
      ? await supabase.from("competitions").update(payload).eq("id", editing.id)
      : await supabase.from("competitions").insert(payload)

    setSaving(false)
    if (err) return toast.error(err.message)

    toast.success(editing ? "Competition updated" : "Competition created")
    setFormOpen(false)
    setEditing(null)
    setForm(emptyForm)
    loadData()
  }

  // --- Delete ---
  const deleteComp = async (id: string) => {
    if (!confirm("Delete this competition? This cannot be undone.")) return
    const { error: err } = await supabase.from("competitions").delete().eq("id", id)
    if (err) return toast.error(err.message)
    toast.success("Deleted")
    if (selectedComp?.id === id) setSelectedComp(null)
    loadData()
  }

  // --- Open edit modal ---
  const openEdit = (comp: Competition) => {
    setEditing(comp)
    setForm({
      name: comp.name,
      event_id: comp.event_id,
      category_id: comp.category_id,
      venue: comp.venue || "",
      date: comp.date,
      time: comp.time,
      max_marks: comp.max_marks,
      instructions: comp.instructions || "",
      status: comp.status,
    })
    setFormOpen(true)
  }

  // --- Load detail data ---
  const openDetail = async (comp: Competition & { event_name?: string }) => {
    setSelectedComp(comp)
    setDetailTab("overview")
    setDetailLoading(true)

    const [pRes, sRes] = await Promise.all([
      supabase.from("participants").select("*").eq("category_id", comp.category_id),
      supabase.from("scores").select("*, participant:participant_id(name)").eq("competition_id", comp.id),
    ])

    if (pRes.data) setCompParticipants(pRes.data)
    if (sRes.data) {
      setCompScores(sRes.data.map((s: any) => ({ ...s, participant_name: s.participant?.name })))
    }
    setDetailLoading(false)
  }

  // --- Filtering ---
  const filtered = allComps.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.event_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const selectedWithMeta = selectedComp
    ? { ...selectedComp, event_name: allComps.find(c => c.id === selectedComp.id)?.event_name, category_name: allComps.find(c => c.id === selectedComp.id)?.category_name }
    : null

  // --- Detail tabs content ---
  const renderOverview = () => {
    if (!selectedWithMeta) return null
    const c = selectedWithMeta
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card"><CardContent className="pt-6 text-center"><Users className="h-8 w-8 mx-auto mb-2 text-primary" /><p className="text-2xl font-bold">{compParticipants.length}</p><p className="text-sm text-muted-foreground">Participants</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6 text-center"><Trophy className="h-8 w-8 mx-auto mb-2 text-amber-500" /><p className="text-2xl font-bold">{c.max_marks}</p><p className="text-sm text-muted-foreground">Max Marks</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6 text-center"><Calendar className="h-8 w-8 mx-auto mb-2 text-emerald-500" /><p className="text-sm font-medium">{formatDate(c.date)}</p><p className="text-xs text-muted-foreground">{formatTime(c.time)}</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6 text-center"><MapPin className="h-8 w-8 mx-auto mb-2 text-destructive" /><p className="text-sm font-medium">{c.venue || "No venue"}</p><p className="text-xs text-muted-foreground">{c.category_name}</p></CardContent></Card>
        {c.instructions && (
          <Card className="glass-card sm:col-span-2 lg:col-span-4">
            <CardContent className="pt-4"><p className="text-sm font-medium mb-1">Instructions</p><p className="text-sm text-muted-foreground">{c.instructions}</p></CardContent>
          </Card>
        )}
        <Card className="glass-card sm:col-span-2 lg:col-span-4">
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-2">Status</p>
            <Badge variant={statusVariant[c.status]} className="text-sm px-3 py-1">{c.status}</Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderParticipants = () => {
    if (detailLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    if (compParticipants.length === 0) return <p className="text-center py-12 text-muted-foreground">No participants in this category.</p>
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {compParticipants.map(p => (
          <Card key={p.id} className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <QrCodeCard value={p.chest_number} size={56} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{p.chest_number}</p>
                  {p.team_id && <p className="text-xs text-muted-foreground">Team assigned</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderResults = () => {
    if (detailLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    const approved = compScores.filter(s => s.is_approved).sort((a, b) => b.marks - a.marks)
    if (approved.length === 0) return <p className="text-center py-12 text-muted-foreground">No approved scores yet.</p>
    return (
      <Card className="glass-card">
        <CardContent className="pt-4">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="pb-2 font-medium">#</th><th className="pb-2 font-medium">Participant</th><th className="pb-2 font-medium text-right">Marks</th></tr></thead>
            <tbody>
              {approved.map((s, i) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 font-medium">{s.participant_name || "Unknown"}</td>
                  <td className="py-2 text-right font-bold text-lg">{s.marks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">Competitions</h1><p className="text-muted-foreground">Manage competitions</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="glass-card"><CardContent className="pt-6"><div className="h-5 w-2/3 bg-muted rounded animate-pulse mb-3" /><div className="h-4 w-1/2 bg-muted rounded animate-pulse mb-2" /><div className="h-4 w-1/3 bg-muted rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold">Competitions</h1><p className="text-muted-foreground">Manage competitions</p></div>
        <Card className="glass-card border-destructive/50">
          <CardContent className="flex flex-col items-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium mb-1">Failed to load competitions</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Detail view ---
  if (selectedComp) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="icon" onClick={() => setSelectedComp(null)}><X className="h-5 w-5" /></Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{selectedComp.name}</h1>
              <Badge variant={statusVariant[selectedComp.status]}>{selectedComp.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{selectedWithMeta?.event_name} &middot; {formatDate(selectedComp.date)} &middot; {selectedComp.venue || "No venue"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setSelectedComp(null); openEdit(selectedComp) }}>
              <Pencil className="mr-1 h-4 w-4" />Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => deleteComp(selectedComp.id)}>
              <Trash2 className="mr-1 h-4 w-4" />Delete
            </Button>
          </div>
        </div>

        <Tabs value={detailTab} onValueChange={(v) => setDetailTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="participants">Participants ({compParticipants.length})</TabsTrigger>
            <TabsTrigger value="results">Results ({compScores.filter(s => s.is_approved).length})</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">{renderOverview()}</TabsContent>
          <TabsContent value="participants" className="mt-4">{renderParticipants()}</TabsContent>
          <TabsContent value="results" className="mt-4">{renderResults()}</TabsContent>
        </Tabs>
      </div>
    )
  }

  // --- List view ---
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Competitions</h1><p className="text-muted-foreground">Manage competitions</p></div>
        <Button className="gradient-primary" onClick={() => { setEditing(null); setForm(emptyForm); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />Create Competition
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search competitions..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="w-40">
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </Select>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center py-16">
            <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">No competitions found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {search || statusFilter !== "all" ? "Try adjusting your search or filters." : "Create your first competition to get started."}
            </p>
            {!search && statusFilter === "all" && (
              <Button className="gradient-primary" onClick={() => { setEditing(null); setForm(emptyForm); setFormOpen(true) }}>
                <Plus className="mr-2 h-4 w-4" />Create Competition
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <Card key={c.id} className="glass-card group cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(c)}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{c.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{c.event_name}</p>
                  </div>
                  <Badge variant={statusVariant[c.status]} className="ml-2 shrink-0">{c.status}</Badge>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{formatDate(c.date)} {formatTime(c.time)}</div>
                  {c.venue && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{c.venue}</div>}
                  <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{c.participant_count} participants</div>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openDetail(c)}>
                    <Eye className="mr-1 h-3.5 w-3.5" />View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(c)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-destructive" onClick={() => deleteComp(c.id)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" />Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Competition" : "Create Competition"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Competition name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value, category_id: "" })}>
              <option value="">Select event</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </Select>
            <Select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
              <Input type="number" placeholder="Max marks" value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: Number(e.target.value) })} />
            </div>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Competition["status"] })}>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </Select>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none"
              placeholder="Instructions (optional)"
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
            <Button className="w-full" onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Create Competition"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
