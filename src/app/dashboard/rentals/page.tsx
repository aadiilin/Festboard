"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, Globe, CalendarDays, KeyRound, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import type { Tenant, LoginType } from "@/types"

const loginTypes: { value: LoginType; label: string }[] = [
  { value: "google", label: "Google Login" },
  { value: "email_password", label: "Email & Password" },
  { value: "magic_link", label: "Magic Link" },
  { value: "none", label: "No Login" },
]

export default function RentalsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: "", domain: "", login_type: "google" as LoginType, rental_days: "30" })
  const supabase = createClient()

  useEffect(() => { loadTenants() }, [])

  const loadTenants = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("tenants").select("*").order("created_at", { ascending: false })
    if (error) { toast.error("Failed to load tenants: " + error.message) }
    else if (data) { setTenants(data as Tenant[]) }
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!form.name.trim() || !form.domain.trim()) {
      toast.error("Organization name and domain are required")
      return
    }
    setSubmitting(true)
    const start = new Date()
    const end = new Date(start)
    end.setDate(end.getDate() + parseInt(form.rental_days))
    const { error } = await supabase.from("tenants").insert({
      name: form.name.trim(),
      domain: form.domain.trim(),
      login_type: form.login_type,
      rental_start: start.toISOString().split("T")[0],
      rental_end: end.toISOString().split("T")[0],
      status: "active",
    })
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Domain already exists" : error.message)
    } else {
      toast.success("Tenant created")
      setShowForm(false)
      setForm({ name: "", domain: "", login_type: "google", rental_days: "30" })
      loadTenants()
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tenant?")) return
    const { error } = await supabase.from("tenants").delete().eq("id", id)
    if (error) toast.error(error.message)
    else { toast.success("Deleted"); loadTenants() }
  }

  const handleStatusToggle = async (tenant: Tenant) => {
    const newStatus = tenant.status === "active" ? "suspended" : "active"
    const { error } = await supabase.from("tenants").update({ status: newStatus }).eq("id", tenant.id)
    if (error) toast.error(error.message)
    else { toast.success(tenant.status === "active" ? "Suspended" : "Activated"); loadTenants() }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rentals</h1>
          <p className="text-muted-foreground">Manage site tenants and rental periods</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> Add Tenant
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. ABC College" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Domain <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. abc.vercel.app" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Login Type</label>
                <Select value={form.login_type} onChange={e => setForm({ ...form, login_type: e.target.value as LoginType })}>
                  {loginTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rental Days</label>
                <Input type="number" min={1} value={form.rental_days} onChange={e => setForm({ ...form, rental_days: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submitting ? "Creating..." : "Create Rental"}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tenants yet. Add your first rental.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map(tenant => (
            <Card key={tenant.id} className={`glass-card ${tenant.status === "suspended" || tenant.status === "expired" ? "opacity-60" : ""}`}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{tenant.name}</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Globe className="h-3 w-3" /> {tenant.domain}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  tenant.status === "active" ? "bg-green-500/10 text-green-500" :
                  tenant.status === "expired" ? "bg-amber-500/10 text-amber-500" :
                  "bg-red-500/10 text-red-500"
                }`}>
                  {tenant.status}
                </span>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <KeyRound className="h-3 w-3" /> {loginTypes.find(t => t.value === tenant.login_type)?.label}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-3 w-3" /> {tenant.rental_start} → {tenant.rental_end}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleStatusToggle(tenant)}>
                    {tenant.status === "active" ? "Suspend" : "Activate"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(tenant.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
