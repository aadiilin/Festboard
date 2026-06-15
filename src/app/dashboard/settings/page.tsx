"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import type { Event, PointSystem } from "@/types"

export default function SettingsPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [pointSystems, setPointSystems] = useState<PointSystem[]>([])
  const [newPoints, setNewPoints] = useState({ name: "", first: 10, second: 7, third: 5, participation: 1 })

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      supabase.from("point_systems").select("*").eq("event_id", selectedEvent).then(({ data }) => data && setPointSystems(data))
    }
  }, [selectedEvent])

  const addPointSystem = async () => {
    if (!newPoints.name.trim() || !selectedEvent) return
    const isDefault = pointSystems.length === 0
    const { error } = await supabase.from("point_systems").insert({ event_id: selectedEvent, ...newPoints, is_default: isDefault })
    if (error) toast.error(error.message)
    else { toast.success("Point system added"); setNewPoints({ name: "", first: 10, second: 7, third: 5, participation: 1 }) }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-3xl font-bold">Settings</h1><p className="text-muted-foreground">Manage point systems for events</p></div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Point Systems</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs">
            <option value="">Select event</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </Select>

          {pointSystems.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Existing Systems</p>
              {pointSystems.map(ps => (
                <div key={ps.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium">{ps.name} {ps.is_default && <span className="text-xs text-muted-foreground">(default)</span>}</p>
                    <p className="text-xs text-muted-foreground">1st: {ps.first} | 2nd: {ps.second} | 3rd: {ps.third} | Participation: {ps.participation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Add New Point System</p>
            <div className="grid gap-3 sm:grid-cols-5">
              <Input placeholder="Name" value={newPoints.name} onChange={(e) => setNewPoints({ ...newPoints, name: e.target.value })} />
              <Input type="number" placeholder="1st" value={newPoints.first} onChange={(e) => setNewPoints({ ...newPoints, first: Number(e.target.value) })} />
              <Input type="number" placeholder="2nd" value={newPoints.second} onChange={(e) => setNewPoints({ ...newPoints, second: Number(e.target.value) })} />
              <Input type="number" placeholder="3rd" value={newPoints.third} onChange={(e) => setNewPoints({ ...newPoints, third: Number(e.target.value) })} />
              <Input type="number" placeholder="Participation" value={newPoints.participation} onChange={(e) => setNewPoints({ ...newPoints, participation: Number(e.target.value) })} />
            </div>
            <Button className="mt-3" onClick={addPointSystem}>Add System</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
