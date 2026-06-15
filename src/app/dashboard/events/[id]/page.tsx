"use client"
import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import {
  ArrowLeft, Loader2, Calendar, MapPin, Users, Gavel, Trophy, Settings,
  UserPlus, Trash2, Search, Download, Plus, Edit3, Copy, MessageCircle,
  CheckCircle, XCircle, Image, Lock, Unlock, Printer, Upload, AlertTriangle,
} from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils"
import toast from "react-hot-toast"
import type { Event, EventStatus, Competition, Participant, Profile, CompetitionJudge, Score, Category } from "@/types"

type Tab = "overview" | "participants" | "judges" | "scores" | "results" | "settings"

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get("tab") as Tab) || "overview")

  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [judges, setJudges] = useState<(Profile & { comps?: { id: string; name: string }[] })[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState("")

  const [judgeDialogOpen, setJudgeDialogOpen] = useState(false)
  const [judgeAddOpen, setJudgeAddOpen] = useState(false)

  const [showMobileTab, setShowMobileTab] = useState(false)

  const tabs: { key: Tab; label: string; icon: typeof Calendar }[] = [
    { key: "overview", label: "Overview", icon: Calendar },
    { key: "participants", label: "Participants", icon: Users },
    { key: "judges", label: "Judges", icon: Gavel },
    { key: "scores", label: "Scores", icon: Trophy },
    { key: "results", label: "Results", icon: Trophy },
    { key: "settings", label: "Settings", icon: Settings },
  ]

  useEffect(() => {
    loadEvent()
  }, [id])

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("tab", activeTab)
    window.history.replaceState({}, "", url.toString())
  }, [activeTab])

  const loadEvent = async () => {
    setLoading(true)
    const { data: ev, error } = await supabase.from("events").select("*").eq("id", id).single()
    if (error || !ev) { setNotFound(true); setLoading(false); return }
    setEvent(ev)
    setEditName(ev.name)

    const [compRes, partRes, catRes, scoreRes] = await Promise.all([
      supabase.from("competitions").select("*").eq("event_id", id),
      supabase.from("participants").select("*").eq("event_id", id),
      supabase.from("categories").select("*").eq("event_id", id).order("display_order"),
      supabase.from("scores").select("*, participants:participant_id(name, chest_number), competitions:competition_id(name)").in(
        "competition_id",
        (await supabase.from("competitions").select("id").eq("event_id", id)).data?.map(c => c.id) ?? []
      ),
    ])
    setCompetitions(compRes.data ?? [])
    setParticipants(partRes.data ?? [])
    setCategories(catRes.data ?? [])
    setScores(scoreRes.data ?? [])

    const compIds = (compRes.data ?? []).map(c => c.id)
    if (compIds.length) {
      const { data: assignments } = await supabase
        .from("competition_judges")
        .select("judge_id, competition_id, competitions:competition_id(name)")
        .in("competition_id", compIds)

      const judgeMap = new Map<string, { id: string; name: string }[]>()
      for (const a of (assignments ?? []) as { judge_id: string; competition_id: string; competitions: unknown }[]) {
        const arr = judgeMap.get(a.judge_id) ?? []
        const comp = a.competitions as { name: string } | { name: string }[] | null
        const compName = Array.isArray(comp) ? comp[0]?.name ?? "" : (comp as { name: string } | null)?.name ?? ""
        arr.push({ id: a.competition_id, name: compName })
        judgeMap.set(a.judge_id, arr)
      }
      const judgeIds = [...judgeMap.keys()]
      if (judgeIds.length) {
        const { data: profiles } = await supabase.from("profiles").select("*").in("id", judgeIds)
        setJudges((profiles ?? []).map(p => ({ ...p, comps: judgeMap.get(p.id) ?? [] })))
      }
    }
    setLoading(false)
  }

  const initials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

  const updateEvent = async (updates: Partial<Event>) => {
    const { error } = await supabase.from("events").update(updates).eq("id", id)
    if (error) toast.error(error.message)
    else { setEvent(prev => prev ? { ...prev, ...updates } : null); toast.success("Updated") }
  }

  /* ── Participants tab ── */
  const [pSearch, setPSearch] = useState("")
  const filteredParticipants = useMemo(() => {
    if (!pSearch) return participants
    const q = pSearch.toLowerCase()
    return participants.filter(p =>
      p.name.toLowerCase().includes(q) || p.chest_number.toLowerCase().includes(q)
    )
  }, [participants, pSearch])

  const exportParticipantsCSV = () => {
    const rows = participants.map(p => [p.chest_number, p.name, p.gender, p.category_id])
    const csv = ["Chest No,Name,Gender,Category", ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `participants-${id}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success("CSV exported")
  }

  const [removePartId, setRemovePartId] = useState<string | null>(null)
  const confirmRemovePart = async () => {
    if (!removePartId) return
    await supabase.from("participants").delete().eq("id", removePartId)
    toast.success("Participant removed")
    setParticipants(p => p.filter(x => x.id !== removePartId))
    setRemovePartId(null)
  }

  /* ── Judges tab ── */
  const [jSearch, setJSearch] = useState("")
  const [removeJudgeConfirm, setRemoveJudgeConfirm] = useState<{ id: string; name: string } | null>(null)
  const [revealedCreds, setRevealedCreds] = useState<string | null>(null)

  const filteredJudges = useMemo(() => {
    if (!jSearch) return judges
    const q = jSearch.toLowerCase()
    return judges.filter(j => j.full_name.toLowerCase().includes(q) || j.email.toLowerCase().includes(q))
  }, [judges, jSearch])

  const removeJudgeFromEvent = async (judgeId: string) => {
    const compIds = competitions.map(c => c.id)
    if (!compIds.length) return
    await supabase.from("competition_judges").delete().in("competition_id", compIds).eq("judge_id", judgeId)
    toast.success("Judge removed")
    setJudges(j => j.filter(x => x.id !== judgeId))
    setRemoveJudgeConfirm(null)
  }

  /* ── Scores tab ── */
  const [scoreMap, setScoreMap] = useState<Record<string, string>>({})
  const [submittingScore, setSubmittingScore] = useState<Record<string, boolean>>({})
  const [selectedScoreComp, setSelectedScoreComp] = useState("")

  const submitScore = async (pId: string) => {
    if (!selectedScoreComp && !competitions[0]) return toast.error("No competition selected")
    const compId = selectedScoreComp || competitions[0]?.id
    const marks = parseFloat(scoreMap[pId])
    if (isNaN(marks)) return toast.error("Enter a valid score")
    setSubmittingScore(prev => ({ ...prev, [pId]: true }))
    const res = await fetch("/api/judge/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competition_id: compId, participant_id: pId, marks }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setSubmittingScore(prev => ({ ...prev, [pId]: false })); return }
    toast.success("Score saved")
    setScoreMap(prev => { const n = { ...prev }; delete n[pId]; return n })
    const { data: newScores } = await supabase.from("scores").select("*, participants:participant_id(name, chest_number), competitions:competition_id(name)").in(
      "competition_id", competitions.map(c => c.id)
    )
    if (newScores) setScores(newScores)
    setSubmittingScore(prev => ({ ...prev, [pId]: false }))
  }

  /* ── Results tab ── */
  const results = useMemo(() => {
    const approved = scores.filter(s => s.is_approved)
    const grouped: Record<string, typeof scores> = {}
    for (const s of approved) {
      if (!grouped[s.competition_id]) grouped[s.competition_id] = []
      grouped[s.competition_id].push(s)
    }
    const rows: { rank: number; name: string; chest: string; comp: string; marks: number; position: string }[] = []
    let rank = 0
    for (const comp of competitions) {
      const compScores = (grouped[comp.id] || []).sort((a, b) => b.marks - a.marks)
      for (let i = 0; i < Math.min(compScores.length, 3); i++) {
        const s = compScores[i]
        const sAny = s as unknown as Record<string, unknown> & { participants?: { name: string; chest_number: string } | null }
        const p = sAny.participants
        rows.push({
          rank: ++rank,
          name: p?.name ?? s.participant_id,
          chest: p?.chest_number ?? "",
          comp: comp.name,
          marks: s.marks,
          position: ["1st", "2nd", "3rd"][i],
        })
      }
    }
    return rows
  }, [scores, competitions])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertTriangle className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-2xl font-bold">Event Not Found</h2>
      <p className="text-muted-foreground">This event doesn't exist or has been removed.</p>
      <Link href="/dashboard/events"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Events</Button></Link>
    </div>
  )

  if (!event) return null

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/events" className="hover:text-foreground">Events</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">{event.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-xl font-bold h-10 w-64" />
                <Button size="sm" onClick={async () => { await updateEvent({ name: editName }); setEditingName(false) }}>
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditName(event.name); setEditingName(false) }}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                {event.name}
                <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-foreground">
                  <Edit3 className="h-4 w-4" />
                </button>
              </h1>
            )}
            <p className="text-sm text-muted-foreground">{event.organization_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={event.status === "active" ? "success" : event.status === "completed" ? "default" : "secondary"}>
            {event.status}
          </Badge>
          <Select value={event.status} onChange={(e) => updateEvent({ status: e.target.value as EventStatus })} className="w-32">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="glass-card">
          <CardContent className="flex items-center gap-3 py-4">
            <Users className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold">{participants.length}</p><p className="text-xs text-muted-foreground">Participants</p></div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="flex items-center gap-3 py-4">
            <Gavel className="h-8 w-8 text-amber-500" />
            <div><p className="text-2xl font-bold">{judges.length}</p><p className="text-xs text-muted-foreground">Judges</p></div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="flex items-center gap-3 py-4">
            <Trophy className="h-8 w-8 text-emerald-500" />
            <div><p className="text-2xl font-bold">{competitions.length}</p><p className="text-xs text-muted-foreground">Competitions</p></div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="flex items-center gap-3 py-4">
            <Calendar className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">{formatDate(event.start_date)}</p>
              <p className="text-xs text-muted-foreground">{formatDate(event.end_date)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="glass-card sm:col-span-2">
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none"
                value={event.description ?? ""}
                onChange={(e) => setEvent({ ...event, description: e.target.value })}
                onBlur={() => updateEvent({ description: event.description })}
                placeholder="Add event description..."
              />
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><Label>Venue</Label><Input value={event.venue ?? ""} onChange={(e) => setEvent({ ...event, venue: e.target.value })} onBlur={() => updateEvent({ venue: event.venue })} /></div>
              <div><Label>Start Date</Label><Input type="date" value={event.start_date?.slice(0, 10) ?? ""} onChange={(e) => updateEvent({ start_date: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={event.end_date?.slice(0, 10) ?? ""} onChange={(e) => updateEvent({ end_date: e.target.value })} /></div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader><CardTitle>Competitions</CardTitle></CardHeader>
            <CardContent>
              {competitions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No competitions yet.</p>
              ) : (
                <div className="space-y-2">
                  {competitions.map(c => (
                    <div key={c.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.venue} · {formatDate(c.date)}</p>
                      </div>
                      <Badge variant={c.status === "ongoing" ? "success" : c.status === "completed" ? "default" : "secondary"}>{c.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "participants" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search participants..." value={pSearch} onChange={(e) => setPSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportParticipantsCSV}>
                <Download className="mr-1 h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>
          <Card className="glass-card">
            <CardContent className="pt-6">
              {filteredParticipants.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No participants found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chest No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredParticipants.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono font-medium">{p.chest_number}</TableCell>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>{p.gender}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => setRemovePartId(p.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "judges" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search judges..." value={jSearch} onChange={(e) => setJSearch(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={() => setJudgeAddOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Add Judge</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredJudges.map(j => (
              <Card key={j.id} className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {initials(j.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{j.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{j.email}</p>
                      {j.organization_name && <p className="text-xs text-muted-foreground">{j.organization_name}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setRemoveJudgeConfirm({ id: j.id, name: j.full_name })}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {j.comps && j.comps.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {j.comps.map(c => <Badge key={c.id} variant="secondary" className="text-[10px]">{c.name}</Badge>)}
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t">
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setRevealedCreds(revealedCreds === j.id ? null : j.id)}
                    >
                      {revealedCreds === j.id ? "Hide credentials" : "Show login credentials"}
                    </button>
                    {revealedCreds === j.id && (
                      <div className="mt-2 text-xs space-y-1 p-2 rounded bg-muted">
                        <p><strong>Email:</strong> {j.email}</p>
                        <p className="text-muted-foreground">Password hidden for security</p>
                        <Button variant="outline" size="sm" className="mt-1 text-[10px] h-6" onClick={() => {
                          navigator.clipboard.writeText(`Judge login for ${event.name}\nEmail: ${j.email}\nLogin at: ${window.location.origin}/judge`)
                          toast.success("Login info copied")
                        }}>
                          <Copy className="mr-1 h-3 w-3" /> Copy Login Info
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredJudges.length === 0 && (
              <p className="text-muted-foreground text-center py-8 col-span-full">No judges assigned yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "scores" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Label className="text-sm">Competition:</Label>
            <Select value={selectedScoreComp || competitions[0]?.id || ""} onChange={(e) => setSelectedScoreComp(e.target.value)} className="w-64">
              {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chest No</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead className="w-24">Score</TableHead>
                      <TableHead className="w-28">Status</TableHead>
                      <TableHead className="w-24">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map(p => {
                      const compId = selectedScoreComp || competitions[0]?.id
                      const existing = scores.find(s => s.participant_id === p.id && s.competition_id === compId)
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono">{p.chest_number}</TableCell>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number" min={0} step={0.1}
                              placeholder={existing?.marks?.toString() ?? "0"}
                              value={scoreMap[p.id] ?? ""}
                              onChange={(e) => setScoreMap(prev => ({ ...prev, [p.id]: e.target.value }))}
                              className="h-8 w-20"
                            />
                          </TableCell>
                          <TableCell>
                            {existing ? <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> {existing.marks}</Badge> : <Badge variant="secondary">Pending</Badge>}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" onClick={() => submitScore(p.id)} disabled={submittingScore[p.id] || !scoreMap[p.id]}>
                              {submittingScore[p.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : "Submit"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "results" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Link href="/dashboard/posters"><Button variant="outline"><Image className="mr-2 h-4 w-4" /> Generate Winner Posters</Button></Link>
            <Link href="/dashboard/certificates"><Button variant="outline"><Trophy className="mr-2 h-4 w-4" /> Generate Certificates</Button></Link>
          </div>
          <Card className="glass-card">
            <CardContent className="pt-6">
              {results.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No approved scores yet. Approve scores to see results.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Chest No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Competition</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-bold">{r.rank}</TableCell>
                          <TableCell className="font-mono">{r.chest}</TableCell>
                          <TableCell>{r.name}</TableCell>
                          <TableCell>{r.comp}</TableCell>
                          <TableCell>{r.marks}</TableCell>
                          <TableCell>
                            <Badge
                              variant={r.position === "1st" ? "success" : r.position === "2nd" ? "secondary" : "default"}
                              className="text-xs"
                            >
                              {r.position}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="glass-card sm:col-span-2">
            <CardHeader><CardTitle>Event Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Event Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={() => updateEvent({ name: editName })} />
              </div>
              <div>
                <Label>Organization</Label>
                <Input value={event.organization_name} onChange={(e) => updateEvent({ organization_name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <textarea className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none" value={event.description ?? ""} onChange={(e) => updateEvent({ description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Venue</Label><Input value={event.venue ?? ""} onChange={(e) => updateEvent({ venue: e.target.value })} /></div>
                <div><Label>Status</Label>
                  <Select value={event.status} onChange={(e) => updateEvent({ status: e.target.value as EventStatus })}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-destructive/30">
            <CardHeader><CardTitle className="text-destructive">Danger Zone</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Deleting this event will remove all associated data. This cannot be undone.</p>
              <Button variant="destructive" onClick={async () => {
                if (!confirm("Are you sure you want to delete this event? This cannot be undone.")) return
                await supabase.from("events").delete().eq("id", id)
                toast.success("Event deleted")
                router.push("/dashboard/events")
              }}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Event
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Dialogs ── */}
      <Dialog open={!!removePartId} onOpenChange={(o) => { if (!o) setRemovePartId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remove Participant</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Remove this participant from the event?</p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setRemovePartId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmRemovePart}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removeJudgeConfirm} onOpenChange={(o) => { if (!o) setRemoveJudgeConfirm(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remove Judge</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Remove <strong>{removeJudgeConfirm?.name}</strong> from all competitions in this event?</p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setRemoveJudgeConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => removeJudgeConfirm && removeJudgeFromEvent(removeJudgeConfirm.id)}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={judgeAddOpen} onOpenChange={setJudgeAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Judge to {event.name}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Use the{" "}
            <Link href="/dashboard/events" className="text-primary underline">Events page</Link>
            {" "}to manage judges, or go to{" "}
            <Link href="/dashboard/judges" className="text-primary underline">Judges Management</Link>.
          </p>
          <Button variant="outline" onClick={() => setJudgeAddOpen(false)} className="w-full">Close</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
