"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { CalendarDays, Users, Trophy, BarChart3, Plus, ArrowRight, Gavel, Loader2, FileSpreadsheet, Image, Award, Settings } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Event } from "@/types"

export default function DashboardPage() {
  const [stats, setStats] = useState({ events: 0, participants: 0, competitions: 0, judges: 0 })
  const [recentEvents, setRecentEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("participants").select("*", { count: "exact", head: true }),
      supabase.from("competitions").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "judge"),
      supabase.from("events").select("*").order("created_at", { ascending: false }).limit(5),
    ]).then(([events, participants, competitions, judges, recent]) => {
      setStats({
        events: events.count ?? 0,
        participants: participants.count ?? 0,
        competitions: competitions.count ?? 0,
        judges: judges.count ?? 0,
      })
      if (recent.data) setRecentEvents(recent.data)
      setLoading(false)
    })
  }, [])

  const statCards = [
    { title: "Events", value: stats.events, icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-500/10", href: "/dashboard/events" },
    { title: "Participants", value: stats.participants, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/dashboard/participants" },
    { title: "Competitions", value: stats.competitions, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10", href: "/dashboard/competitions" },
    { title: "Judges", value: stats.judges, icon: Gavel, color: "text-purple-500", bg: "bg-purple-500/10", href: "/dashboard/judges" },
  ]

  const quickActions = [
    { label: "Create Event", icon: Plus, href: "/dashboard/events/new", color: "text-blue-500" },
    { label: "Add Participants", icon: Users, href: "/dashboard/participants", color: "text-emerald-500" },
    { label: "Manage Judges", icon: Gavel, href: "/dashboard/judges", color: "text-purple-500" },
    { label: "Import / Export", icon: FileSpreadsheet, href: "/dashboard/import-export", color: "text-amber-500" },
    { label: "Posters", icon: Image, href: "/dashboard/posters", color: "text-pink-500" },
    { label: "Certificates", icon: Award, href: "/dashboard/certificates", color: "text-cyan-500" },
    { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics", color: "text-indigo-500" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings", color: "text-muted-foreground" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your events and activities</p>
        </div>
        <Link href="/dashboard/events/new"><Button className="gradient-primary"><Plus className="mr-2 h-4 w-4" />Create Event</Button></Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Card key={i} className="glass-card animate-pulse"><CardContent className="h-24" /></Card>)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="glass-card hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map(action => (
                <Link key={action.label} href={action.href}>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                    <span className="text-xs text-center font-medium">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Events
              <Link href="/dashboard/events"><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No events yet.</p>
            ) : (
              <div className="space-y-3">
                {recentEvents.map(e => (
                  <Link key={e.id} href={`/dashboard/events/${e.id}`}>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{e.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(e.start_date)}</p>
                      </div>
                      <Badge variant={e.status === "active" ? "success" : "secondary"} className="text-[10px]">{e.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
