"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Plus, GripVertical, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import type { Event, Category } from "@/types"

export default function CategoriesPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const supabase = createClient()

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
  }, [])

  useEffect(() => {
    if (selectedEvent) loadCategories()
  }, [selectedEvent])

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").eq("event_id", selectedEvent).order("display_order")
    if (data) setCategories(data)
  }

  const addCategory = async () => {
    if (!newCategory.trim() || !selectedEvent) return
    const { error } = await supabase.from("categories").insert({
      event_id: selectedEvent, name: newCategory, display_order: categories.length,
    })
    if (error) toast.error(error.message)
    else { toast.success("Category added"); setNewCategory(""); loadCategories() }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return
    await supabase.from("categories").delete().eq("id", id)
    loadCategories()
    toast.success("Category deleted")
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Categories</h1><p className="text-muted-foreground">Manage categories for your events</p></div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Add Category</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs">
              <option value="">Select event</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </Select>
            <Input placeholder="Category name (e.g., Junior, Senior)" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} />
            <Button onClick={addCategory}><Plus className="mr-1 h-4 w-4" />Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="pt-6">
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No categories yet. Add one above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell><GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" /></TableCell>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>{cat.display_order}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
