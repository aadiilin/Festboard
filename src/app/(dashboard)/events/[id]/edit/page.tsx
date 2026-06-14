"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import type { Event } from "@/types"

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [form, setForm] = useState({
    name: "", organization_name: "", description: "", venue: "",
    start_date: "", end_date: "", status: "draft" as Event["status"], languages: ["en"],
  })

  const eventId = Array.isArray(params.id) ? params.id[0] : params.id

  useEffect(() => {
    if (eventId) {
      supabase.from("events").select("*").eq("id", eventId).single().then(({ data }) => {
        if (data) setForm({ name: data.name, organization_name: data.organization_name, description: data.description || "", venue: data.venue || "", start_date: data.start_date, end_date: data.end_date, status: data.status, languages: data.languages })
        setFetching(false)
      })
    } else {
      setFetching(false)
    }
  }, [eventId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId) return
    setLoading(true)
    const { error } = await supabase.from("events").update(form).eq("id", eventId)
    setLoading(false)
    if (error) toast.error(error.message)
    else { toast.success("Event updated!"); router.push("/dashboard/events") }
  }

  if (fetching) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/events"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div><h1 className="text-3xl font-bold">Edit Event</h1></div>
      </div>
      <Card className="glass-card">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Event Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Organization</Label><Input value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Venue</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Event["status"] })}>
                  <option value="draft">Draft</option><option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
