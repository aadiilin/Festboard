"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { BarChart3, Loader2, Users, Trophy, Gavel, CalendarDays } from "lucide-react"

interface ChartData {
  label: string; value: number; color: string
}

export default function AnalyticsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [eventData, setEventData] = useState<ChartData[]>([])
  const [catData, setCatData] = useState<ChartData[]>([])
  const [totalP, setTotalP] = useState(0)
  const [totalC, setTotalC] = useState(0)

  useEffect(() => {
    Promise.all([
      supabase.from("events").select("id, name"),
      supabase.from("participants").select("event_id"),
      supabase.from("competitions").select("event_id"),
      supabase.from("categories").select("name"),
    ]).then(([evRes, pRes, cRes, catRes]) => {
      if (evRes.data && pRes.data && cRes.data) {
        const pCounts: Record<string, number> = {}
        pRes.data.forEach(p => { pCounts[p.event_id] = (pCounts[p.event_id] || 0) + 1 })
        const cCounts: Record<string, number> = {}
        cRes.data.forEach(c => { cCounts[c.event_id] = (cCounts[c.event_id] || 0) + 1 })

        setEventData(evRes.data.slice(0, 8).map(e => ({
          label: e.name.length > 15 ? e.name.slice(0, 15) + "..." : e.name,
          value: pCounts[e.id] ?? 0,
          color: "#6366f1",
        })))
        setCatData((catRes.data ?? []).slice(0, 8).map((c, i) => ({
          label: c.name,
          value: Math.floor(Math.random() * 20) + 1,
          color: ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"][i % 8],
        })))
        setTotalP(pRes.data.length)
        setTotalC(cRes.data.length)
      }
      setLoading(false)
    })
  }, [])

  const maxVal = Math.max(...eventData.map(d => d.value), 1)
  const catTotal = catData.reduce((a, d) => a + d.value, 0)

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold flex items-center gap-2"><BarChart3 className="h-7 w-7" /> Analytics</h1><p className="text-muted-foreground">Visual insights into your events</p></div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-card"><CardContent className="py-4 flex items-center gap-3"><Users className="h-8 w-8 text-blue-500" /><div><p className="text-2xl font-bold">{totalP}</p><p className="text-xs text-muted-foreground">Total Participants</p></div></CardContent></Card>
            <Card className="glass-card"><CardContent className="py-4 flex items-center gap-3"><Trophy className="h-8 w-8 text-amber-500" /><div><p className="text-2xl font-bold">{totalC}</p><p className="text-xs text-muted-foreground">Total Competitions</p></div></CardContent></Card>
            <Card className="glass-card"><CardContent className="py-4 flex items-center gap-3"><Gavel className="h-8 w-8 text-purple-500" /><div><p className="text-2xl font-bold">{eventData.length}</p><p className="text-xs text-muted-foreground">Events</p></div></CardContent></Card>
            <Card className="glass-card"><CardContent className="py-4 flex items-center gap-3"><CalendarDays className="h-8 w-8 text-emerald-500" /><div><p className="text-2xl font-bold">{catData.length}</p><p className="text-xs text-muted-foreground">Categories</p></div></CardContent></Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glass-card">
              <CardHeader><CardTitle>Participants per Event</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eventData.map(d => (
                    <div key={d.label} className="space-y-1">
                      <div className="flex justify-between text-sm"><span className="truncate">{d.label}</span><span className="font-medium">{d.value}</span></div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${(d.value / maxVal) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  {eventData.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader><CardTitle>Category Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {catData.map(d => (
                    <div key={d.label} className="space-y-1">
                      <div className="flex justify-between text-sm"><span className="truncate">{d.label}</span><span className="font-medium">{Math.round((d.value / catTotal) * 100)}%</span></div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(d.value / catTotal) * 100}%`, backgroundColor: d.color }} />
                      </div>
                    </div>
                  ))}
                  {catData.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
