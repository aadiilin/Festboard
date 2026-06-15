"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
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
import { Plus, Edit3, Trash2, Loader2, Tags } from "lucide-react"
import toast from "react-hot-toast"
import type { Category, Event } from "@/types"

export default function CategoriesPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<(Category & { event_name?: string })[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState("")
  const [eventId, setEventId] = useState("")
  const [order, setOrder] = useState("0")
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from("categories").select("*, events:event_id(name)").order("display_order"),
      supabase.from("events").select("*").order("name"),
    ]).then(([catRes, evRes]) => {
      if (catRes.data) setCategories(catRes.data.map((c: Record<string, unknown>) => ({
        ...c as unknown as Category,
        event_name: (c.events as { name: string } | null)?.name ?? "",
      })))
      if (evRes.data) setEvents(evRes.data)
      setLoading(false)
    })
  }, [])

  const openAdd = () => {
    setEditing(null); setName(""); setEventId(events[0]?.id ?? ""); setOrder("0"); setDialogOpen(true)
  }

  const openEdit = (c: Category & { event_name?: string }) => {
    setEditing(c); setName(c.name); setEventId(c.event_id); setOrder(String(c.display_order)); setDialogOpen(true)
  }

  const save = async () => {
    if (!name.trim() || !eventId) return toast.error("Name and event are required")
    setSaving(true)
    const payload = { name: name.trim(), event_id: eventId, display_order: parseInt(order) || 0 }
    if (editing) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editing.id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success("Category updated")
    } else {
      const { error } = await supabase.from("categories").insert(payload)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success("Category created")
    }
    setDialogOpen(false); setSaving(false); setName("")
    const { data } = await supabase.from("categories").select("*, events:event_id(name)").order("display_order")
    if (data) setCategories(data.map((c: Record<string, unknown>) => ({ ...c as unknown as Category, event_name: (c.events as { name: string } | null)?.name ?? "" })))
  }

  const deleteCat = async () => {
    if (!deleteId) return
    await supabase.from("categories").delete().eq("id", deleteId)
    toast.success("Deleted")
    setCategories(p => p.filter(c => c.id !== deleteId)); setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold flex items-center gap-2"><Tags className="h-7 w-7" /> Categories</h1><p className="text-muted-foreground">Manage categories for your events</p></div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Category</Button>
      </div>

      <Card className="glass-card">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No categories yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Event</TableHead><TableHead>Order</TableHead><TableHead className="w-24">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.event_name}</TableCell>
                    <TableCell>{c.display_order}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" /></div>
            <div><Label>Event</Label>
              <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
                <option value="">Select event</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </Select>
            </div>
            <div><Label>Display Order</Label><Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} /></div>
            <Button onClick={save} disabled={saving} className="w-full">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Category</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete this category?</p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteCat}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
