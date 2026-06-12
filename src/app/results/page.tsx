"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Search, Trophy, Medal, UserCircle } from "lucide-react"
import type { Event, Participant, Score, Competition } from "@/types"

export default function ResultsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchMode, setSearchMode] = useState<"name" | "chest">("name")
  const [results, setResults] = useState<any[]>([])
  const [searched, setSearched] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from("events").select("*").eq("status", "active").then(({ data }) => data && setEvents(data))
  }, [])

  const handleSearch = async () => {
    if (!searchTerm.trim() || !selectedEvent) return

    const query = supabase
      .from("participants")
      .select("*")
      .eq("event_id", selectedEvent)

    if (searchMode === "name") query.ilike("name", `%${searchTerm}%`)
    else query.ilike("chest_number", `%${searchTerm}%`)

    const { data: participants } = await query
    if (!participants) { setResults([]); setSearched(true); return }

    const resultsWithScores = await Promise.all(
      participants.map(async (p) => {
        const { data: scores } = await supabase
          .from("scores")
          .select("*, competition:competition_id(name)")
          .eq("participant_id", p.id)
          .eq("is_approved", true)
          .returns<any>()

        return {
          ...p,
          scores: scores?.map((s: any) => ({ marks: s.marks, competition: s.competition?.name })) || [],
        }
      })
    )

    setResults(resultsWithScores)
    setSearched(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Public Results</h1>
          <p className="text-muted-foreground mt-2">Search for participant results</p>
        </div>

        <Card className="glass-card mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-3 flex-wrap">
              <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs">
                <option value="">Select event</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </Select>
              <div className="flex gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder={searchMode === "name" ? "Search by name..." : "Search by chest number..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch}>Search</Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSearchMode(searchMode === "name" ? "chest" : "name")}>
                <UserCircle className="mr-1 h-4 w-4" />{searchMode === "name" ? "Switch to Chest" : "Switch to Name"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {searched && results.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center text-muted-foreground">No results found.</CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {results.map(r => (
            <Card key={r.id} className="glass-card">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{r.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono">{r.chest_number}</p>
                  </div>
                  <Badge variant="secondary">{r.gender}</Badge>
                </div>

                {r.scores.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Scores</p>
                    {r.scores.map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="text-sm">{s.competition}</span>
                        <span className="font-bold">{s.marks}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No scores available yet.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
