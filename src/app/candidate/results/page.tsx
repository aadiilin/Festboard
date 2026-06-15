"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSession, type CandidateSession } from "@/lib/candidate-session"
import { Card, CardContent } from "@/components/ui/card"
import { Award, Medal, Trophy } from "lucide-react"

interface ResultItem {
  competitionName: string; marks: number; maxMarks: number; position: string
}

export default function CandidateResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<ResultItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace("/candidate"); return }
    fetch(`/api/candidate/results?chestNo=${encodeURIComponent(s.chestNo)}`)
      .then(r => r.ok ? r.json() : [])
      .then(setResults)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const positionIcon = (pos: string) => {
    if (pos === "1st") return <Trophy className="h-5 w-5 text-amber-500" />
    if (pos === "2nd") return <Medal className="h-5 w-5 text-gray-400" />
    if (pos === "3rd") return <Medal className="h-5 w-5 text-orange-600" />
    return <Award className="h-5 w-5 text-muted-foreground" />
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">My Results</h1>

      {results.length === 0 ? (
        <div className="text-center py-12">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No results available yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    r.position === "1st" ? "bg-amber-500/10" :
                    r.position === "2nd" ? "bg-gray-400/10" :
                    r.position === "3rd" ? "bg-orange-600/10" :
                    "bg-muted"
                  }`}>
                    {positionIcon(r.position)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{r.competitionName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {r.position} · {r.marks}/{r.maxMarks} marks
                    </p>
                  </div>
                  <div className={`text-lg font-bold shrink-0 ${
                    r.position === "1st" ? "text-amber-500" :
                    r.position === "2nd" ? "text-gray-400" :
                    r.position === "3rd" ? "text-orange-600" :
                    "text-muted-foreground"
                  }`}>
                    {r.position === "1st" ? "1" : r.position === "2nd" ? "2" : r.position === "3rd" ? "3" : "-"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
