"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Image, Upload } from "lucide-react"
import type { Event, Poster } from "@/types"

export default function PostersPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [posters, setPosters] = useState<Poster[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const supabase = createClient()

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      supabase.from("posters").select("*").eq("event_id", selectedEvent).then(({ data }) => data && setPosters(data))
    }
  }, [selectedEvent])

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Posters</h1><p className="text-muted-foreground">Generate winner posters</p></div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Generate Poster</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Upload a poster template and auto-generate winner posters with dynamic variables.</p>
          <div className="flex gap-3">
            <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs">
              <option value="">Select event</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </Select>
            <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Upload Template</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="pt-6">
          {posters.length === 0 ? (
            <div className="text-center py-12">
              <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No posters generated yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posters.map(p => (
                <Card key={p.id} className="overflow-hidden">
                  <div className="aspect-[3/4] bg-muted" />
                  <CardContent className="p-3">
                    <p className="text-sm font-medium">Poster</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
