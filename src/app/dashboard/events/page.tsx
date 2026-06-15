"use client"
import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Plus, Calendar, Copy, ExternalLink, UserPlus, Gavel, Trash2, Loader2, Search, Check, Copy as CopyIcon, MessageCircle, X } from "lucide-react"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"
import type { Event, EventStatus, Profile, Competition } from "@/types"

interface JudgeWithComps extends Profile {
  competitions: { id: string; name: string }[]
}

export default function EventsPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [judgeEvent, setJudgeEvent] = useState<Event | null>(null)
  const [judges, setJudges] = useState<JudgeWithComps[]>([])
  const [judgesLoading, setJudgesLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string } | null>(null)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newOrg, setNewOrg] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newComps, setNewComps] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [compList, setCompList] = useState<Competition[]>([])
  const [createdJudge, setCreatedJudge] = useState<{ email: string; password: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    const { data } = await supabase.from("events").select("*").order("created_at", { ascending: false })
    if (data) setEvents(data)
    setLoading(false)
  }

  const openJudges = async (event: Event) => {
    setJudgeEvent(event)
    setJudgesLoading(true)
    setSearchQuery("")
    setConfirmRemove(null)

    const { data: comps } = await supabase.from("competitions").select("id, name, event_id, category_id, date, time, max_marks, status, created_at, updated_at").eq("event_id", event.id)
    setCompList(comps ?? [])
    const compIds = (comps ?? []).map(c => c.id)

    if (compIds.length) {
      const { data: assignments } = await supabase
        .from("competition_judges")
        .select("judge_id, competition_id, competitions:competition_id(name)")
        .in("competition_id", compIds)

      const judgeMap = new Map<string, { id: string; name: string }[]>()
      for (const a of assignments ?? []) {
        const existing = judgeMap.get(a.judge_id as string) ?? []
        const comp = a.competitions as { name: string } | { name: string }[] | null
        const compName = Array.isArray(comp) ? comp[0]?.name ?? "" : (comp as { name: string } | null)?.name ?? ""
        existing.push({ id: a.competition_id as string, name: compName })
        judgeMap.set(a.judge_id as string, existing)
      }

      const judgeIds = [...judgeMap.keys()]
      if (judgeIds.length) {
        const { data: profiles } = await supabase.from("profiles").select("*").in("id", judgeIds)
        setJudges((profiles ?? []).map(p => ({
          ...p,
          competitions: judgeMap.get(p.id) ?? [],
        })))
      } else { setJudges([]) }
    } else { setJudges([]) }
    setJudgesLoading(false)
  }

  const filteredJudges = useMemo(() => {
    if (!searchQuery) return judges
    const q = searchQuery.toLowerCase()
    return judges.filter(j =>
      j.full_name.toLowerCase().includes(q) ||
      j.email.toLowerCase().includes(q) ||
      (j.organization_name ?? "").toLowerCase().includes(q)
    )
  }, [judges, searchQuery])

  const initials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!newName.trim()) e.name = "Name is required"
    if (!newEmail.trim()) e.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) e.email = "Invalid email format"
    if (!newOrg.trim()) e.org = "Organization is required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const addJudgeToEvent = async () => {
    if (!validate()) return
    if (!judgeEvent) return
    setAdding(true)
    setCreatedJudge(null)

    const res = await fetch("/api/admin/judges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || null,
        organization: newOrg.trim(),
        password: newPassword || null,
        competition_ids: newComps.length ? newComps : compList.map(c => c.id),
      }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setAdding(false); return }

    setCreatedJudge({ email: data.email, password: data.password })
    toast.success("Judge created successfully!")
    setNewName(""); setNewEmail(""); setNewPhone(""); setNewOrg(""); setNewPassword(""); setNewComps([])
    setErrors({})
    setAdding(false)
    if (judgeEvent) openJudges(judgeEvent)
  }

  const confirmRemoveJudge = (judgeId: string, judgeName: string) => {
    setConfirmRemove({ id: judgeId, name: judgeName })
  }

  const executeRemove = async () => {
    if (!confirmRemove || !judgeEvent) return
    const { data: comps } = await supabase.from("competitions").select("id").eq("event_id", judgeEvent.id)
    if (!comps?.length) return
    await supabase.from("competition_judges").delete().in("competition_id", comps.map(c => c.id)).eq("judge_id", confirmRemove.id)
    toast.success(`Removed ${confirmRemove.name} from this event`)
    setConfirmRemove(null)
    openJudges(judgeEvent)
  }

  const toggleComp = (compId: string) => {
    setNewComps(prev =>
      prev.includes(compId) ? prev.filter(c => c !== compId) : [...prev, compId]
    )
  }

  const handleDuplicate = async (event: Event) => {
    const { error } = await supabase.from("events").insert({
      user_id: event.user_id,
      name: `${event.name} (Copy)`,
      organization_name: event.organization_name,
      description: event.description,
      venue: event.venue,
      start_date: event.start_date,
      end_date: event.end_date,
      languages: event.languages,
      status: "draft",
    })
    if (error) toast.error("Failed to duplicate event")
    else { toast.success("Event duplicated!"); loadEvents() }
  }

  const statusVariant: Record<EventStatus, "default" | "success" | "warning" | "secondary"> = {
    active: "success", draft: "secondary", completed: "default", cancelled: "warning",
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">Manage your events</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button className="gradient-primary"><Plus className="mr-2 h-4 w-4" />Create Event</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <Card key={i} className="glass-card animate-pulse"><CardContent className="h-48" /></Card>)}
        </div>
      ) : events.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No events yet. Create your first event!</p>
            <Link href="/dashboard/events/new" className="mt-4">
              <Button className="gradient-primary"><Plus className="mr-2 h-4 w-4" />Create Event</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className="glass-card group cursor-pointer"
              onDoubleClick={() => {
                if (window.innerWidth < 768) {
                  window.location.href = `/dashboard/events/${event.id}`
                } else {
                  window.open(`/dashboard/events/${event.id}`, "_blank")
                }
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className="cursor-pointer min-w-0 flex-1"
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        window.location.href = `/dashboard/events/${event.id}`
                      } else {
                        window.open(`/dashboard/events/${event.id}`, "_blank")
                      }
                    }}
                  >
                    <CardTitle className="text-lg hover:text-primary transition-colors">{event.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{event.organization_name}</p>
                  </div>
                  <Badge variant={statusVariant[event.status]}>{event.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {event.venue && <p>📍 {event.venue}</p>}
                  <p>📅 {formatDate(event.start_date)} - {formatDate(event.end_date)}</p>
                </div>
                <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/dashboard/events/${event.id}/edit`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => handleDuplicate(event)}>
                    <Copy className="mr-1 h-3 w-3" /> Duplicate
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openJudges(event)}>
                    <Gavel className="mr-1 h-3 w-3" /> Judges
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.innerWidth < 768) {
                        window.location.href = `/dashboard/events/${event.id}`
                      } else {
                        window.open(`/dashboard/events/${event.id}`, "_blank")
                      }
                    }}
                  >
                    <ExternalLink className="mr-1 h-3 w-3" /> Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>

      <Dialog open={!!judgeEvent} onOpenChange={(open) => { if (!open) { setJudgeEvent(null); setConfirmRemove(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Judges — {judgeEvent?.name}</DialogTitle></DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search judges by name, email, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {judgesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filteredJudges.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              {searchQuery ? "No judges match your search." : "No judges assigned to this event yet."}
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {filteredJudges.map(j => (
                <div key={j.id} className="flex items-center gap-3 rounded-md border p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {initials(j.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{j.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{j.email}</p>
                    {j.organization_name && (
                      <p className="text-xs text-muted-foreground">{j.organization_name}</p>
                    )}
                    {j.competitions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {j.competitions.map(c => (
                          <Badge key={c.id} variant="secondary" className="text-[10px] px-1.5 py-0">{c.name}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => confirmRemoveJudge(j.id, j.full_name)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t">
            <Button onClick={() => { setAddOpen(true); setCreatedJudge(null); setErrors({}) }} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />Add New Judge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmRemove} onOpenChange={(open) => { if (!open) setConfirmRemove(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remove Judge</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove <strong>{confirmRemove?.name}</strong> from this event? This will unassign them from all competitions under this event.
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>Cancel</Button>
            <Button variant="destructive" onClick={executeRemove}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={(open) => { if (!open) { setAddOpen(false); setCreatedJudge(null); setErrors({}) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{createdJudge ? "Judge Created" : "Add New Judge"}</DialogTitle>
          </DialogHeader>

          {createdJudge ? (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-2">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Judge created successfully!</p>
                <div className="text-xs space-y-1">
                  <p><strong>Email:</strong> {createdJudge.email}</p>
                  <p><strong>Password:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-400">{createdJudge.password}</code></p>
                </div>
                <p className="text-xs text-muted-foreground">Share these credentials with the judge.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`Judge Login\nEmail: ${createdJudge.email}\nPassword: ${createdJudge.password}`)
                    toast.success("Credentials copied")
                  }}
                >
                  <CopyIcon className="mr-1 h-3 w-3" /> Copy Credentials
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = encodeURIComponent(
                      `Your judge login for FestBoard:\nEmail: ${createdJudge.email}\nPassword: ${createdJudge.password}\nLogin at: ${window.location.origin}/judge`
                    )
                    window.open(`https://wa.me/?text=${text}`, "_blank")
                  }}
                >
                  <MessageCircle className="mr-1 h-3 w-3" /> Send via WhatsApp
                </Button>
              </div>
              <Button onClick={() => { setAddOpen(false); setCreatedJudge(null) }} className="w-full">Done</Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="efn">Full Name <span className="text-destructive">*</span></Label>
                <Input id="efn" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Judge name" />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="eem">Email <span className="text-destructive">*</span></Label>
                <Input id="eem" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="judge@example.com" />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="eorg">Organization / Institution <span className="text-destructive">*</span></Label>
                <Input id="eorg" value={newOrg} onChange={(e) => setNewOrg(e.target.value)} placeholder="e.g. College name" />
                {errors.org && <p className="text-xs text-destructive mt-1">{errors.org}</p>}
              </div>
              <div>
                <Label htmlFor="eph">Phone</Label>
                <Input id="eph" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone number" />
              </div>
              <div>
                <Label htmlFor="epw">Password (leave blank to auto-generate)</Label>
                <Input id="epw" type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Auto-generated if empty" />
              </div>
              {compList.length > 0 && (
                <div>
                  <Label>Assign to Competitions</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1 max-h-40 overflow-y-auto border rounded-lg p-2">
                    {compList.map(c => (
                      <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted rounded px-2 py-1">
                        <input
                          type="checkbox"
                          checked={newComps.includes(c.id)}
                          onChange={() => toggleComp(c.id)}
                          className="rounded border-muted-foreground"
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                  {newComps.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Leave empty to assign to all competitions</p>
                  )}
                </div>
              )}
              <Button onClick={addJudgeToEvent} disabled={adding} className="w-full">
                {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {adding ? "Creating..." : "Create Judge"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
