"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"
import { Gavel, Plus, Search, Grid3X3, List, Edit3, Trash2, Copy, MessageCircle, Eye, EyeOff, RotateCcw, UserPlus, Loader2, X, Check, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Upload, Camera, Ban } from "lucide-react"

type ViewMode = "card" | "table"
type StatusFilter = "all" | "active" | "inactive"
type Step = "info" | "login" | "assign" | "success"

interface Judge {
  id: string
  full_name: string
  email: string
  phone?: string
  organization_name?: string
  role: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  events?: { id: string; name: string }[]
  competitions?: { id: string; name: string }[]
}

interface Competition {
  id: string
  name: string
  event_id: string
}

interface Event {
  id: string
  name: string
}

interface Assignment {
  id: string
  judge_id: string
  competition_id: string
  created_at: string
  judge_name?: string
  comp_name?: string
  event_name?: string
}

function generatePassword(): string {
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ"
  const lower = "abcdefghjkmnpqrstuvwxyz"
  const nums = "23456789"
  const syms = "@#$!%&*"
  const all = upper + lower + nums + syms
  let pwd = upper[Math.floor(Math.random() * upper.length)] + lower[Math.floor(Math.random() * lower.length)] + nums[Math.floor(Math.random() * nums.length)] + syms[Math.floor(Math.random() * syms.length)]
  for (let i = 0; i < 6; i++) pwd += all[Math.floor(Math.random() * all.length)]
  return pwd.split("").sort(() => Math.random() - 0.5).join("")
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

function credsText(c: { email: string; password: string }) {
  return `FestBoard Judge Login\nURL: ${window.location.origin}/judge\nEmail: ${c.email}\nPassword: ${c.password}`
}

function credsWhatsApp(c: { email: string; password: string }) {
  return `You have been added as a Judge on FestBoard 🎓\nLogin here: ${window.location.origin}/judge\nEmail: ${c.email}\nPassword: ${c.password}\nPlease change your password after first login.`
}

export default function JudgesPage() {
  const supabase = createClient()

  const [judges, setJudges] = useState<Judge[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [eventFilter, setEventFilter] = useState("all")
  const [viewMode, setViewMode] = useState<ViewMode>("card")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  /* Add Judge multi-step */
  const [showAdd, setShowAdd] = useState(false)
  const [step, setStep] = useState<Step>("info")
  const [form, setForm] = useState({ name: "", email: "", phone: "", organization: "", password: "", role: "judge", avatar_url: "", selectedEvents: [] as string[], selectedComp: "" })
  const [isCreating, setIsCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [pwStrength, setPwStrength] = useState(0)
  const [createdCreds, setCreatedCreds] = useState<{ name: string; email: string; password: string } | null>(null)
  const [formError, setFormError] = useState("")

  /* Edit */
  const [editJudge, setEditJudge] = useState<Judge | null>(null)
  const [editForm, setEditForm] = useState({ name: "", phone: "", org: "" })
  const [editPw, setEditPw] = useState("")
  const [showEditPw, setShowEditPw] = useState(false)
  const [editing, setEditing] = useState(false)
  const [resettingPw, setResettingPw] = useState(false)

  /* Delete */
  const [deleteJudge, setDeleteJudge] = useState<Judge | null>(null)
  const [deleting, setDeleting] = useState(false)

  /* Assign */
  const [assignComp, setAssignComp] = useState("")
  const [assignEvent, setAssignEvent] = useState("")
  const [assignJudge, setAssignJudge] = useState("")
  const [assigning, setAssigning] = useState(false)

  /* Filtered competitions for assign section */
  const [assignComps, setAssignComps] = useState<Competition[]>([])
  const [assignEvents, setAssignEvents] = useState<Event[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("judges_view_mode") as ViewMode | null
    if (stored) setViewMode(stored)
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [jRes, cRes, aRes, eRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "judge").order("created_at", { ascending: false }),
      supabase.from("competitions").select("*"),
      supabase.from("competition_judges").select("*, judge:judge_id(full_name), competition:competition_id(name, event_id)"),
      supabase.from("events").select("*"),
    ])
    if (jRes.data) {
      const judgesWithEvents = await Promise.all((jRes.data as Judge[]).map(async (j) => {
        const { data: comps } = await supabase.from("competition_judges").select("*, competition:competition_id(name)").eq("judge_id", j.id)
        const evSet = new Set<string>()
        const compsList: { id: string; name: string }[] = []
        const evsList: { id: string; name: string }[] = []
        if (comps) {
          comps.forEach((a: any) => {
            if (a.competition?.name) compsList.push({ id: a.competition_id, name: a.competition.name })
            if (a.competition?.event_id) evSet.add(a.competition.event_id)
          })
        }
        const { data: eventsData } = await supabase.from("events").select("id, name")
        if (eventsData) {
          eventsData.forEach(ev => { if (evSet.has(ev.id)) evsList.push(ev) })
        }
        return { ...j, competitions: compsList, events: evsList }
      }))
      setJudges(judgesWithEvents)
    }
    if (cRes.data) setCompetitions(cRes.data)
    if (eRes.data) setEvents(eRes.data)
    if (aRes.data) {
      setAssignments((aRes.data as any[]).map(a => ({
        ...a,
        judge_name: a.judge?.full_name,
        comp_name: a.competition?.name,
      })))
    }
    setLoading(false)
  }

  /* Load competitions filtered by selected event for assign section */
  useEffect(() => {
    if (assignEvent) {
      setAssignComps(competitions.filter(c => c.event_id === assignEvent))
    } else {
      setAssignComps(competitions)
    }
  }, [assignEvent, competitions])

  /* Load events for add judge */
  useEffect(() => {
    if (form.selectedComp) {
      const comp = competitions.find(c => c.id === form.selectedComp)
      if (comp) {
        supabase.from("events").select("*").eq("id", comp.event_id).then(({ data }) => {
          if (data) setAssignEvents(data)
        })
      } else {
        setAssignEvents([])
      }
    }
  }, [form.selectedComp, competitions])

  /* Password strength */
  useEffect(() => {
    let s = 0
    if (form.password.length >= 8) s += 25
    if (/[A-Z]/.test(form.password)) s += 25
    if (/[0-9]/.test(form.password)) s += 25
    if (/[^A-Za-z0-9]/.test(form.password)) s += 25
    setPwStrength(s)
  }, [form.password])

  const filteredJudges = useMemo(() => {
    return judges.filter(j => {
      const q = search.toLowerCase()
      const matchSearch = !q || j.full_name.toLowerCase().includes(q) || j.email.toLowerCase().includes(q) || (j.organization_name ?? "").toLowerCase().includes(q)
      const matchStatus = statusFilter === "all" || (statusFilter === "active" && j.is_active) || (statusFilter === "inactive" && !j.is_active)
      const matchEvent = eventFilter === "all" || (j.events && j.events.some(ev => ev.id === eventFilter))
      return matchSearch && matchStatus && matchEvent
    })
  }, [judges, search, statusFilter, eventFilter])

  const activeCount = judges.filter(j => j.is_active).length
  const assignedCount = judges.filter(j => j.events && j.events.length > 0).length

  const toggleView = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem("judges_view_mode", mode)
  }

  const selectAll = () => {
    if (selectedIds.length === filteredJudges.length) setSelectedIds([])
    else setSelectedIds(filteredJudges.map(j => j.id))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  /* ── Create Judge ── */
  const handleCreateJudge = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.organization.trim() || !form.password.trim()) {
      setFormError("Fill all required fields")
      return
    }
    if (form.password.length < 8) {
      setFormError("Password must be at least 8 characters")
      return
    }
    setIsCreating(true)
    setFormError("")
    try {
      const res = await fetch("/api/admin/judges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          organization: form.organization.trim(),
          password: form.password,
          role: form.role,
          avatar_url: form.avatar_url || null,
          competition_ids: form.selectedComp ? [form.selectedComp] : [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create judge")
      setCreatedCreds({ name: form.name.trim(), email: form.email.trim(), password: form.password })
      setStep("success")
      fetchAll()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  const resetAddForm = () => {
    setForm({ name: "", email: "", phone: "", organization: "", password: "", role: "judge", avatar_url: "", selectedEvents: [], selectedComp: "" })
    setStep("info")
    setShowAdd(false)
    setFormError("")
    setCreatedCreds(null)
    setShowPassword(false)
  }

  /* ── Edit Judge ── */
  const openEdit = (j: Judge) => {
    setEditJudge(j)
    setEditForm({ name: j.full_name, phone: j.phone ?? "", org: j.organization_name ?? "" })
    setEditPw("")
  }

  const saveEdit = async () => {
    if (!editJudge || !editForm.name.trim()) return toast.error("Name is required")
    setEditing(true)
    const payload: any = { full_name: editForm.name.trim(), phone: editForm.phone.trim() || null, organization_name: editForm.org.trim() || null }
    if (editPw) payload.password = editPw
    const res = await fetch(`/api/admin/judges/${editJudge.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) { toast.error("Failed to update"); setEditing(false); return }
    toast.success("Judge updated")
    setEditJudge(null)
    setEditing(false)
    fetchAll()
  }

  const resetPassword = async (j: Judge) => {
    setResettingPw(true)
    const res = await fetch(`/api/admin/judges/${j.id}/reset-password`, { method: "POST" })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setResettingPw(false); return }
    setCreatedCreds({ name: j.full_name, email: j.email, password: data.password })
    setResettingPw(false)
  }

  /* ── Delete Judge ── */
  const handleDelete = async () => {
    if (!deleteJudge) return
    setDeleting(true)
    const res = await fetch(`/api/admin/judges/${deleteJudge.id}`, { method: "DELETE" })
    if (!res.ok) { toast.error("Failed to delete"); setDeleting(false); return }
    toast.success("Judge deleted")
    setDeleteJudge(null)
    setDeleting(false)
    fetchAll()
  }

  const bulkDelete = async () => {
    if (!selectedIds.length) return
    if (!confirm(`Delete ${selectedIds.length} judges?`)) return
    for (const id of selectedIds) {
      await fetch(`/api/admin/judges/${id}`, { method: "DELETE" })
    }
    toast.success(`Deleted ${selectedIds.length} judges`)
    setSelectedIds([])
    fetchAll()
  }

  /* ── Assign ── */
  const handleAssign = async () => {
    if (!assignComp || !assignJudge) return toast.error("Select competition and judge")
    setAssigning(true)
    const { error } = await supabase.from("competition_judges").insert({ competition_id: assignComp, judge_id: assignJudge })
    if (error) { toast.error(error.message); setAssigning(false); return }
    toast.success("Judge assigned")
    setAssignComp("")
    setAssignJudge("")
    setAssigning(false)
    fetchAll()
  }

  const removeAssignment = async (id: string) => {
    await supabase.from("competition_judges").delete().eq("id", id)
    toast.success("Assignment removed")
    fetchAll()
  }

  /* ── Toggle Active ── */
  const toggleActive = async (j: Judge) => {
    const { error } = await supabase.from("profiles").update({ is_active: !j.is_active }).eq("id", j.id)
    if (error) { toast.error(error.message); return }
    toast.success(j.is_active ? "Deactivated" : "Activated")
    fetchAll()
  }

  /* ── Bulk Export CSV ── */
  const bulkExport = () => {
    const target = selectedIds.length ? judges.filter(j => selectedIds.includes(j.id)) : filteredJudges
    const headers = "Name,Email,Phone,Organization,Role,Events,Status\n"
    const rows = target.map(j => `${j.full_name},${j.email},${j.phone ?? ""},${j.organization_name ?? ""},${j.role},${(j.events ?? []).map(e => e.name).join("; ")},${j.is_active ? "Active" : "Inactive"}`).join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "judges.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  /* ── Bulk WhatsApp ── */
  const bulkWhatsApp = () => {
    const target = judges.filter(j => selectedIds.includes(j.id))
    if (!target.length) return toast.error("Select judges first")
    const msg = target.map(j => `Name: ${j.full_name}\nEmail: ${j.email}`).join("\n\n")
    window.open(`https://wa.me/?text=${encodeURIComponent("FestBoard Judges:\n\n" + msg)}`, "_blank")
  }

  /* ═══════════════ RENDER ═══════════════ */

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><div className="h-8 w-32 bg-white/5 rounded animate-pulse" /><div className="h-4 w-48 bg-white/5 rounded animate-pulse mt-2" /></div>
          <div className="h-10 w-28 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3"><div className="h-20 bg-white/5 rounded animate-pulse" /><div className="h-20 bg-white/5 rounded animate-pulse" /><div className="h-20 bg-white/5 rounded animate-pulse" /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-44 bg-white/5 rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Gavel className="h-7 w-7" /> Judges</h1>
          <p className="text-muted-foreground">Manage and assign judges to events</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <>
              <button onClick={bulkExport} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10">Export CSV</button>
              <button onClick={bulkWhatsApp} className="px-3 py-2 rounded-lg bg-green-600/20 border border-green-600/30 text-sm text-green-400 hover:bg-green-600/30">WhatsApp {selectedIds.length}</button>
              <button onClick={bulkDelete} className="px-3 py-2 rounded-lg bg-red-600/20 border border-red-600/30 text-sm text-red-400 hover:bg-red-600/30">Delete {selectedIds.length}</button>
            </>
          )}
          <button onClick={() => { setStep("info"); setFormError(""); setShowAdd(true) }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            <UserPlus className="h-4 w-4" /> Add Judge
          </button>
        </div>
      </div>

      {/* ═══ STATS ═══ */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-gradient-to-br from-blue-600/10 to-blue-600/5 border border-blue-600/20 p-4">
          <p className="text-sm text-blue-400 font-medium">Total Judges</p>
          <p className="text-3xl font-bold mt-1">{judges.length}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-600/10 to-emerald-600/5 border border-emerald-600/20 p-4">
          <p className="text-sm text-emerald-400 font-medium">Active</p>
          <p className="text-3xl font-bold mt-1">{activeCount}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-amber-600/10 to-amber-600/5 border border-amber-600/20 p-4">
          <p className="text-sm text-amber-400 font-medium">Assigned to Events</p>
          <p className="text-3xl font-bold mt-1">{assignedCount}</p>
        </div>
      </div>

      {/* ═══ SEARCH & FILTER ═══ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input type="text" placeholder="Search judges..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50 transition-colors" />
        </div>
        <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-500/50">
          <option value="all">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-500/50">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          <button onClick={() => toggleView("card")} className={`p-2 ${viewMode === "card" ? "bg-blue-600 text-white" : "bg-white/5 text-white/50 hover:text-white"}`}><Grid3X3 className="h-4 w-4" /></button>
          <button onClick={() => toggleView("table")} className={`p-2 ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-white/5 text-white/50 hover:text-white"}`}><List className="h-4 w-4" /></button>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      {filteredJudges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4"><Gavel className="h-8 w-8 text-white/30" /></div>
          <h3 className="text-lg font-medium mb-1">{search || statusFilter !== "all" || eventFilter !== "all" ? "No judges match your filters" : "No judges yet"}</h3>
          <p className="text-sm text-white/40 mb-6">{search || statusFilter !== "all" || eventFilter !== "all" ? "Try adjusting your search or filters." : "Add your first judge to get started."}</p>
          {!search && statusFilter === "all" && eventFilter === "all" && (
            <button onClick={() => { setStep("info"); setFormError(""); setShowAdd(true) }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              <UserPlus className="h-4 w-4" /> Add Judge
            </button>
          )}
        </div>
      ) : viewMode === "card" ? (
        /* ═══ CARD VIEW ═══ */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJudges.map(j => (
            <div key={j.id} className="group rounded-xl bg-[#1a1a1a] border border-white/10 p-5 hover:border-blue-500/30 transition-all">
              <div className="flex items-start gap-3">
                <label className="relative flex items-center mt-1">
                  <input type="checkbox" checked={selectedIds.includes(j.id)} onChange={() => toggleSelect(j.id)} className="accent-blue-600 w-4 h-4" />
                </label>
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {initials(j.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{j.full_name}</p>
                  <p className="text-xs text-white/50 truncate">{j.email}</p>
                  {j.organization_name && <p className="text-xs text-white/40 mt-0.5">{j.organization_name}</p>}
                  {j.phone && <p className="text-xs text-white/40">{j.phone}</p>}
                  {j.events && j.events.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {j.events.map(ev => <span key={ev.id} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400">{ev.name}</span>)}
                    </div>
                  )}
                </div>
                <div className={`shrink-0 w-2 h-2 rounded-full mt-2 ${j.is_active ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-white/20"}`} />
              </div>
              <div className="flex gap-1.5 mt-4 pt-3 border-t border-white/10">
                <button onClick={() => openEdit(j)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 text-xs hover:bg-white/10 transition-colors"><Edit3 className="h-3 w-3" /> Edit</button>
                <button onClick={() => resetPassword(j)} disabled={resettingPw} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 text-xs hover:bg-white/10 transition-colors"><RefreshCw className="h-3 w-3" /> Reset PW</button>
                <button onClick={() => setDeleteJudge(j)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-600/10 text-red-400 text-xs hover:bg-red-600/20 transition-colors"><Trash2 className="h-3 w-3" /> Delete</button>
              </div>
              <div className="flex gap-1.5 mt-1.5">
                <button onClick={() => { setCreatedCreds({ name: j.full_name, email: j.email, password: "••••••••" }); setStep("success"); setShowAdd(true) }} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 text-xs hover:bg-white/10 transition-colors"><Copy className="h-3 w-3" /> Credentials</button>
                <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(credsWhatsApp({ email: j.email, password: "••••••••" }))}`, "_blank") }} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-600/10 text-green-400 text-xs hover:bg-green-600/20 transition-colors"><MessageCircle className="h-3 w-3" /> Share</button>
                <button onClick={() => toggleActive(j)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 text-xs hover:bg-white/10 transition-colors"><Ban className="h-3 w-3" /> {j.is_active ? "Disable" : "Enable"}</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ═══ TABLE VIEW ═══ */
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 text-left w-10"><input type="checkbox" checked={selectedIds.length === filteredJudges.length && filteredJudges.length > 0} onChange={selectAll} className="accent-blue-600 w-4 h-4" /></th>
                  <th className="p-3 text-left text-white/50 font-medium">Judge</th>
                  <th className="p-3 text-left text-white/50 font-medium hidden sm:table-cell">Email</th>
                  <th className="p-3 text-left text-white/50 font-medium hidden md:table-cell">Organization</th>
                  <th className="p-3 text-left text-white/50 font-medium hidden lg:table-cell">Events</th>
                  <th className="p-3 text-center text-white/50 font-medium">Status</th>
                  <th className="p-3 text-right text-white/50 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJudges.map((j, i) => (
                  <tr key={j.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3"><input type="checkbox" checked={selectedIds.includes(j.id)} onChange={() => toggleSelect(j.id)} className="accent-blue-600 w-4 h-4" /></td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">{initials(j.full_name)}</div>
                        <span className="font-medium truncate max-w-[140px]">{j.full_name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-white/60 text-xs hidden sm:table-cell">{j.email}</td>
                    <td className="p-3 text-white/60 text-xs hidden md:table-cell">{j.organization_name || "—"}</td>
                    <td className="p-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {j.events && j.events.length > 0 ? j.events.slice(0, 2).map(ev => (
                          <span key={ev.id} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400">{ev.name}</span>
                        )) : <span className="text-white/30 text-[10px]">None</span>}
                        {j.events && j.events.length > 2 && <span className="text-[10px] text-white/30">+{j.events.length - 2}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${j.is_active ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-white/20"}`} />
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(j)} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Edit"><Edit3 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => resetPassword(j)} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Reset Password"><RefreshCw className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { setCreatedCreds({ name: j.full_name, email: j.email, password: "••••••••" }); setStep("success"); setShowAdd(true) }} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Copy Credentials"><Copy className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(credsWhatsApp({ email: j.email, password: "••••••••" }))}`, "_blank") }} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Share WhatsApp"><MessageCircle className="h-3.5 w-3.5" /></button>
                        <button onClick={() => toggleActive(j)} className={`p-1.5 rounded hover:bg-white/10 transition-colors ${!j.is_active ? "text-emerald-400" : "text-white/50"}`} title={j.is_active ? "Deactivate" : "Activate"}><Ban className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteJudge(j)} className="p-1.5 rounded hover:bg-red-600/20 transition-colors text-red-400" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ ASSIGN JUDGE SECTION ═══ */}
      <div className="rounded-xl border border-white/10 p-5 bg-[#1a1a1a]">
        <h2 className="text-lg font-semibold mb-4">Assign Judge to Competition</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-white/50 block mb-1">Event</label>
            <select value={assignEvent} onChange={(e) => { setAssignEvent(e.target.value); setAssignComp("") }}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-500/50 min-w-[160px]">
              <option value="">All Events</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">Competition</label>
            <select value={assignComp} onChange={(e) => setAssignComp(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-500/50 min-w-[160px]">
              <option value="">Select competition</option>
              {assignComps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">Judge</label>
            <select value={assignJudge} onChange={(e) => setAssignJudge(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-500/50 min-w-[160px]">
              <option value="">{judges.length === 0 ? "No judges yet" : "Select judge"}</option>
              {judges.map(j => <option key={j.id} value={j.id}>{j.full_name}</option>)}
            </select>
            {judges.length === 0 && (
              <button onClick={() => { setStep("info"); setFormError(""); setShowAdd(true) }} className="text-xs text-blue-400 mt-1 hover:underline">No judges found? Create one</button>
            )}
          </div>
          <button onClick={handleAssign} disabled={assigning || !assignComp || !assignJudge}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Assign
          </button>
        </div>

        {assignments.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/50 text-xs">
                  <th className="pb-2 font-medium">Judge</th>
                  <th className="pb-2 font-medium">Competition</th>
                  <th className="pb-2 font-medium hidden sm:table-cell">Date</th>
                  <th className="pb-2 font-medium w-16">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id} className="border-b border-white/5">
                    <td className="py-2">{a.judge_name || "Unknown"}</td>
                    <td className="py-2 text-white/60">{a.comp_name || "Unknown"}</td>
                    <td className="py-2 text-white/40 text-xs hidden sm:table-cell">{formatDate(a.created_at)}</td>
                    <td className="py-2">
                      <button onClick={() => removeAssignment(a.id)} className="p-1 rounded hover:bg-red-600/20 text-red-400 transition-colors" title="Remove">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════ ADD JUDGE MODAL ═══════════════ */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget && step !== "success") resetAddForm() }}>
          <div className="w-full max-w-lg rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                {step === "success" ? <Check className="h-5 w-5 text-emerald-500" /> : <UserPlus className="h-5 w-5" />}
                <h2 className="text-lg font-semibold">
                  {step === "info" ? "Add New Judge" : step === "login" ? "Set Login Credentials" : step === "assign" ? "Assign to Competition" : "Judge Created!"}
                </h2>
              </div>
              <button onClick={resetAddForm} className="p-1 rounded hover:bg-white/10 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            {/* Steps indicator */}
            {step !== "success" && (
              <div className="flex px-5 pt-4 gap-2">
                {["info", "login", "assign"].map((s, i) => (
                  <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${step === s ? "bg-blue-600" : ["info", "login", "assign"].indexOf(step) > i ? "bg-blue-600/50" : "bg-white/10"}`} />
                ))}
              </div>
            )}

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-600/10 border border-red-600/20 text-sm text-red-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {formError}
                </div>
              )}

              {/* STEP 1: Info */}
              {step === "info" && (
                <>
                  <div className="flex justify-center mb-2">
                    <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-blue-500/50 transition-colors relative">
                      <Camera className="h-6 w-6 text-white/30" />
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (ev) => setForm(p => ({ ...p, avatar_url: ev.target?.result as string }))
                          reader.readAsDataURL(file)
                        }
                      }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Full Name <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="Enter full name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Email Address <span className="text-red-400">*</span></label>
                    <input type="email" placeholder="judge@example.com" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Phone Number</label>
                    <input type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Organization / Institution <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="e.g. ABC College" value={form.organization} onChange={(e) => setForm(p => ({ ...p, organization: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50" />
                  </div>
                </>
              )}

              {/* STEP 2: Login */}
              {step === "login" && (
                <>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Password <span className="text-red-400">*</span></label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input type={showPassword ? "text" : "password"} placeholder="Min 8 characters" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                          className="w-full px-3 py-2 pr-9 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <button onClick={() => { const pw = generatePassword(); setForm(p => ({ ...p, password: pw })) }} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 whitespace-nowrap">Generate</button>
                      {form.password && (
                        <button onClick={() => { navigator.clipboard.writeText(form.password); toast.success("Password copied") }} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10"><Copy className="h-4 w-4" /></button>
                      )}
                    </div>
                  </div>
                  {form.password && (
                    <div>
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`flex-1 h-1.5 rounded-full ${pwStrength >= i * 25 ? i <= 1 ? "bg-red-500" : i <= 2 ? "bg-amber-500" : i <= 3 ? "bg-yellow-500" : "bg-emerald-500" : "bg-white/10"}`} />
                        ))}
                      </div>
                      <p className="text-[10px] text-white/40">{pwStrength <= 25 ? "Weak" : pwStrength <= 50 ? "Fair" : pwStrength <= 75 ? "Good" : "Strong"}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Role</label>
                    <select value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-500/50">
                      <option value="judge">Panel Judge</option>
                      <option value="head_judge">Head Judge</option>
                      <option value="guest_judge">Guest Judge</option>
                    </select>
                  </div>
                </>
              )}

              {/* STEP 3: Assign */}
              {step === "assign" && (
                <>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Select Competition</label>
                    <select value={form.selectedComp} onChange={(e) => setForm(p => ({ ...p, selectedComp: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-500/50">
                      <option value="">Skip (assign later)</option>
                      {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <p className="text-xs text-white/30">You can also assign judges to competitions later from the section below.</p>
                </>
              )}

              {/* STEP 4: Success */}
              {step === "success" && createdCreds && (
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-600/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-7 w-7 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Judge Created Successfully!</h3>
                  <p className="text-sm text-white/50 mb-4">Share these credentials with the judge.</p>
                  <div className="text-left rounded-lg bg-white/5 p-4 space-y-2 text-sm border border-white/10">
                    <p><span className="text-white/40">Name:</span> <span className="font-medium">{createdCreds.name}</span></p>
                    <p><span className="text-white/40">Email:</span> {createdCreds.email}</p>
                    <p><span className="text-white/40">Password:</span> <code className="px-1.5 py-0.5 rounded bg-white/5 text-emerald-400 text-xs font-mono">{createdCreds.password}</code></p>
                    <p><span className="text-white/40">Login:</span> <span className="text-blue-400 text-xs">{window.location.origin}/judge</span></p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => { navigator.clipboard.writeText(credsText(createdCreds)); toast.success("Credentials copied") }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                      <Copy className="h-4 w-4" /> Copy All
                    </button>
                    <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(credsWhatsApp(createdCreds))}`, "_blank") }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {step !== "success" && (
              <div className="flex items-center justify-between p-5 border-t border-white/10">
                <button onClick={() => {
                  if (step === "login") setStep("info")
                  else if (step === "assign") setStep("login")
                  else resetAddForm()
                }} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                  <ChevronLeft className="h-4 w-4" /> {step === "info" ? "Cancel" : "Back"}
                </button>
                <button onClick={() => {
                  if (step === "info") {
                    if (!form.name.trim() || !form.email.trim() || !form.organization.trim()) {
                      setFormError("Name, email, and organization are required")
                      return
                    }
                    setFormError("")
                    setStep("login")
                  } else if (step === "login") {
                    if (!form.password.trim() || form.password.length < 8) {
                      setFormError("Password must be at least 8 characters")
                      return
                    }
                    setFormError("")
                    setStep("assign")
                  } else if (step === "assign") {
                    handleCreateJudge()
                  }
                }} disabled={step === "assign" && isCreating}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {step === "assign" ? (
                    isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />
                  ) : <ChevronRight className="h-4 w-4" />}
                  {step === "info" ? "Next" : step === "login" ? "Next" : isCreating ? "Creating..." : "Create Judge"}
                </button>
              </div>
            )}

            {/* Success footer */}
            {step === "success" && (
              <div className="p-5 border-t border-white/10">
                <button onClick={resetAddForm} className="w-full py-2 rounded-lg border border-white/20 text-sm hover:bg-white/5 transition-colors">Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ EDIT JUDGE MODAL ═══════════════ */}
      {editJudge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setEditJudge(null) }}>
          <div className="w-full max-w-md rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Edit3 className="h-5 w-5" /> Edit Judge</h2>
              <button onClick={() => setEditJudge(null)} className="p-1 rounded hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-white/50 block mb-1">Full Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-xs text-white/50 block mb-1">Phone</label>
                <input type="tel" value={editForm.phone} onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-xs text-white/50 block mb-1">Organization</label>
                <input type="text" value={editForm.org} onChange={(e) => setEditForm(p => ({ ...p, org: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-xs text-white/50 block mb-1">Reset Password <span className="text-white/30 text-[10px]">(leave blank to keep current)</span></label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showEditPw ? "text" : "password"} placeholder="New password" value={editPw} onChange={(e) => setEditPw(e.target.value)}
                      className="w-full px-3 py-2 pr-9 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50" />
                    <button onClick={() => setShowEditPw(!showEditPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                      {showEditPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button onClick={() => { const pw = generatePassword(); setEditPw(pw) }} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 whitespace-nowrap">Generate</button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditJudge(null)} className="flex-1 py-2 rounded-lg border border-white/20 text-sm hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={saveEdit} disabled={editing} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {editing ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ DELETE CONFIRM ═══════════════ */}
      {deleteJudge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setDeleteJudge(null) }}>
          <div className="w-full max-w-sm rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Delete Judge</h3>
            <p className="text-sm text-white/50 mb-1">Are you sure you want to delete <strong className="text-white">{deleteJudge.full_name}</strong>?</p>
            <p className="text-xs text-white/30 mb-5">This will remove their account and all assignments.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteJudge(null)} className="flex-1 py-2 rounded-lg border border-white/20 text-sm hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
