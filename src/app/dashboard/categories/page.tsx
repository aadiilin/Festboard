"use client"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import type { Event, Category } from "@/types"

export default function CategoriesPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data && data.length > 0) { setEvents(data); setSelectedEvent(data[0].id) }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (selectedEvent) loadCategories()
  }, [selectedEvent])

  const loadCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").eq("event_id", selectedEvent).order("display_order")
    if (error) toast.error("Failed to load: " + error.message)
    if (data) setCategories(data)
  }

  const addCategory = async () => {
    const name = inputRef.current?.value?.trim()
    if (!name) { toast.error("Enter a category name"); return }
    if (!selectedEvent) { toast.error("No event selected"); return }
    setAdding(true)
    const { error } = await supabase.from("categories").insert({
      event_id: selectedEvent, name, display_order: categories.length,
    })
    setAdding(false)
    if (error) toast.error(error.message)
    else { if (inputRef.current) inputRef.current.value = ""; toast.success("Added!"); loadCategories() }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return
    const { error } = await supabase.from("categories").delete().eq("id", id)
    if (error) toast.error(error.message)
    else { loadCategories(); toast.success("Deleted") }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Categories</h1><p className="text-muted-foreground">Manage categories for your events</p></div>

      {events.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Create an event first before adding categories.</CardContent></Card>
      ) : (
        <>
          <Card className="glass-card">
            <CardHeader><CardTitle>Add Category</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs">
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </Select>
                <Input ref={inputRef} placeholder="Category name" onKeyDown={(e) => e.key === "Enter" && addCategory()} />
                <Button onClick={addCategory} disabled={adding}>
                  {adding ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
                  Add
                </Button>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id}>
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
        </>
      )}
    </div>
  )
}
