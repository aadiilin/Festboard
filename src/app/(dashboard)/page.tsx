"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { CalendarDays, Users, Trophy, BarChart3 } from "lucide-react"

export default function DashboardPage() {
  const [stats, setStats] = useState({ events: 0, participants: 0, competitions: 0, teams: 0 })
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("participants").select("*", { count: "exact", head: true }),
      supabase.from("competitions").select("*", { count: "exact", head: true }),
      supabase.from("teams").select("*", { count: "exact", head: true }),
    ]).then(([events, participants, competitions, teams]) => {
      setStats({
        events: events.count ?? 0,
        participants: participants.count ?? 0,
        competitions: competitions.count ?? 0,
        teams: teams.count ?? 0,
      })
    })
  }, [])

  const statCards = [
    { title: "Events", value: stats.events, icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Participants", value: stats.participants, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Competitions", value: stats.competitions, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Teams", value: stats.teams, icon: BarChart3, color: "text-purple-500", bg: "bg-purple-500/10" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your events and activities</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="glass-card">
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
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Create a new event to get started, or manage your existing events from the Events section.</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Your recent activity will appear here once you start managing events.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
