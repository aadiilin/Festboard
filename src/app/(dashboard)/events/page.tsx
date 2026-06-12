"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Plus, Calendar, Copy, ExternalLink } from "lucide-react"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"
import type { Event } from "@/types"

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    const { data } = await supabase.from("events").select("*").order("created_at", { ascending: false })
    if (data) setEvents(data)
    setLoading(false)
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

  const statusVariant: Record<string, "default" | "success" | "warning" | "secondary"> = {
    active: "success", draft: "secondary", completed: "default", cancelled: "warning",
  }

  return (
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
            <Card key={event.id} className="glass-card group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{event.name}</CardTitle>
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
                  <Link href={`/projector/${event.id}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-1 h-3 w-3" /> Projector
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
