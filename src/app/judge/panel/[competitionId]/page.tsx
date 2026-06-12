"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { ArrowLeft, CheckCircle2, Save, Send } from "lucide-react"
import toast from "react-hot-toast"
import type { Competition, Participant } from "@/types"

export default function JudgePanelPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [scores, setScores] = useState<Record<string, { marks: string; is_draft: boolean; is_approved: boolean }>>({})

  useEffect(() => {
    loadCompetition()
  }, [params.competitionId])

  const loadCompetition = async () => {
    const { data: comp } = await supabase.from("competitions").select("*").eq("id", params.competitionId).single()
    if (comp) {
      setCompetition(comp)
      const { data: parts } = await supabase
        .from("participants")
        .select("*")
        .eq("event_id", comp.event_id)
        .eq("category_id", comp.category_id)
      if (parts) setParticipants(parts)

      // Load existing scores
      const { data: existingScores } = await supabase
        .from("scores")
        .select("*")
        .eq("competition_id", params.competitionId)
        .eq("judge_id", user?.id)
      if (existingScores) {
        const scoreMap: Record<string, any> = {}
        existingScores.forEach(s => {
          scoreMap[s.participant_id] = { marks: String(s.marks), is_draft: s.is_draft, is_approved: s.is_approved }
        })
        setScores(scoreMap)
      }
    }
  }

  const saveScore = async (participantId: string, isDraft: boolean) => {
    const score = scores[participantId]
    if (!score || !score.marks) return toast.error("Enter marks")

    const payload = {
      competition_id: params.competitionId,
      participant_id: participantId,
      judge_id: user?.id,
      marks: Number(score.marks),
      is_draft: isDraft,
      is_approved: false,
    }

    const { error } = await supabase.from("scores").upsert(payload, {
      onConflict: "competition_id,participant_id,judge_id",
    })

    if (error) toast.error(error.message)
    else {
      toast.success(isDraft ? "Draft saved" : "Scores submitted")
      setScores(prev => ({
        ...prev,
        [participantId]: { ...prev[participantId], is_draft: isDraft },
      }))
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/judge")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{competition?.name || "Loading..."}</h1>
          <p className="text-muted-foreground">
            Max marks: {competition?.max_marks} | {participants.length} participants
          </p>
        </div>
      </div>

      {participants.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">No participants assigned to this competition.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {participants.map((p) => {
            const score = scores[p.id]
            const isSubmitted = score && !score.is_draft && !score.is_approved
            const isApproved = score?.is_approved

            return (
              <Card key={p.id} className="glass-card">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.chest_number}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      className="w-24 text-lg font-bold text-center"
                      placeholder="0"
                      max={competition?.max_marks || 100}
                      value={score?.marks || ""}
                      onChange={(e) =>
                        setScores(prev => ({
                          ...prev,
                          [p.id]: { marks: e.target.value, is_draft: true, is_approved: false },
                        }))
                      }
                      disabled={isApproved}
                    />
                    <span className="text-sm text-muted-foreground">/ {competition?.max_marks}</span>
                  </div>

                  <div className="flex gap-2">
                    {!isApproved && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => saveScore(p.id, true)}>
                          <Save className="mr-1 h-3 w-3" />Draft
                        </Button>
                        <Button size="sm" className="gradient-primary" onClick={() => saveScore(p.id, false)}>
                          <Send className="mr-1 h-3 w-3" />Submit
                        </Button>
                      </>
                    )}
                    {isApproved && (
                      <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" />Approved</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
