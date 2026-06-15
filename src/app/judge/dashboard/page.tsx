"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, LogOut, Gavel, CheckCircle, Trophy } from "lucide-react"
import toast from "react-hot-toast"

interface JudgeUser {
  id: string; email: string; full_name: string; organization_name?: string
}

interface Competition {
  id: string; name: string; event_id: string; event_name: string
  organization_name: string; venue?: string; date?: string; max_marks: number
  status: string
}

interface Participant {
  id: string; name: string; chest_number: string; photo_url?: string
  category_id: string; event_id: string
}

interface Score {
  id: string; competition_id: string; participant_id: string
  marks: number; participants?: { name: string; chest_number: string }
  competitions?: { name: string }
}

export default function JudgeDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<JudgeUser | null>(null)
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [myScores, setMyScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedComp, setSelectedComp] = useState("")
  const [scores, setScores] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const stored = localStorage.getItem("festboard_judge")
    if (!stored) { router.replace("/judge"); return }
    setUser(JSON.parse(stored))
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [eventsRes, scoresRes] = await Promise.all([
        fetch("/api/judge/events"),
        fetch("/api/judge/scores"),
      ])
      if (!eventsRes.ok) throw new Error("Failed to load events")
      const eventsData = await eventsRes.json()
      setCompetitions(eventsData.competitions ?? [])
      setParticipants(eventsData.participants ?? [])
      if (eventsData?.competitions?.[0]) setSelectedComp(eventsData.competitions[0].id)
      if (scoresRes.ok) {
        const scoresData = await scoresRes.json()
        setMyScores(scoresData)
      }
    } catch (e) {
      toast.error("Failed to load data")
    }
    setLoading(false)
  }

  const comp = competitions.find(c => c.id === selectedComp)
  const compParticipants = participants.filter(p => p.event_id === comp?.event_id)
  const compScores = myScores.filter(s => s.competition_id === selectedComp)

  const handleScoreChange = (participantId: string, value: string) => {
    setScores(prev => ({ ...prev, [participantId]: value }))
  }

  const submitScore = async (participantId: string) => {
    if (!selectedComp) return
    const marks = parseFloat(scores[participantId])
    if (isNaN(marks)) return toast.error("Enter a valid score")
    setSubmitting(prev => ({ ...prev, [participantId]: true }))
    const res = await fetch("/api/judge/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competition_id: selectedComp, participant_id: participantId, marks }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setSubmitting(prev => ({ ...prev, [participantId]: false })); return }
    toast.success("Score submitted")
    setScores(prev => { const n = { ...prev }; delete n[participantId]; return n })
    const scoresRes = await fetch("/api/judge/scores")
    if (scoresRes.ok) setMyScores(await scoresRes.json())
    setSubmitting(prev => ({ ...prev, [participantId]: false }))
  }

  const handleLogout = () => {
    localStorage.removeItem("festboard_judge")
    router.push("/judge")
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Gavel className="h-5 w-5 text-primary" />
            <span className="font-semibold">Judge Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.full_name}</span>
            <Badge variant="outline" className="text-xs">{user?.organization_name}</Badge>
            <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.full_name?.split(" ")[0]}</h1>
          <p className="text-muted-foreground">Select a competition to start scoring</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Label className="text-sm font-medium">Competition:</Label>
          <Select value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)} className="w-full sm:w-72">
            <option value="">Select competition</option>
            {competitions.map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.event_name}</option>
            ))}
          </Select>
          {comp && (
            <Badge>{comp.max_marks} max marks</Badge>
          )}
        </div>

        {comp && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                {comp.name}
                <span className="text-sm font-normal text-muted-foreground">— {comp.event_name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {compParticipants.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No participants found for this event.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Participant</TableHead>
                        <TableHead>Chest No</TableHead>
                        <TableHead className="w-28">Score</TableHead>
                        <TableHead className="w-32">Status</TableHead>
                        <TableHead className="w-28">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compParticipants.map((p, i) => {
                        const existingScore = compScores.find(s => s.participant_id === p.id)
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell className="text-muted-foreground">{p.chest_number}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                max={comp.max_marks}
                                step={0.1}
                                placeholder={existingScore?.marks?.toString() ?? "0"}
                                value={scores[p.id] ?? ""}
                                onChange={(e) => handleScoreChange(p.id, e.target.value)}
                                className="h-8 w-20"
                              />
                            </TableCell>
                            <TableCell>
                              {existingScore ? (
                                <Badge variant="success" className="gap-1">
                                  <CheckCircle className="h-3 w-3" /> Scored
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => submitScore(p.id)}
                                disabled={submitting[p.id] || !scores[p.id]}
                              >
                                {submitting[p.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : "Submit"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {myScores.length > 0 && (
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg">My Submitted Scores</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competition</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Chest No</TableHead>
                      <TableHead>Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myScores.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{s.competitions?.name ?? s.competition_id}</TableCell>
                        <TableCell>{s.participants?.name ?? s.participant_id}</TableCell>
                        <TableCell>{s.participants?.chest_number ?? ""}</TableCell>
                        <TableCell><Badge variant="success">{s.marks}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
