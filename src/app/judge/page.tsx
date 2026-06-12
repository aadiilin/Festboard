"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Gavel, ExternalLink } from "lucide-react"
import type { Competition } from "@/types"

export default function JudgeHomePage() {
  const { user, profile } = useAuth()
  const supabase = createClient()
  const [competitions, setCompetitions] = useState<(Competition & { event_name?: string })[]>([])

  useEffect(() => {
    if (user) {
      supabase
        .from("competition_judges")
        .select("competition:competition_id(*, event:event_id(name))")
        .eq("judge_id", user.id)
        .returns<any>()
        .then(({ data }) => {
          if (data) {
            setCompetitions(
              data.map((d: any) => ({
                ...d.competition,
                event_name: d.competition?.event?.name,
              }))
            )
          }
        })
    }
  }, [user])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Gavel className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Judge Panel</h1>
          <p className="text-muted-foreground">Welcome, {profile?.full_name}</p>
        </div>
      </div>

      {competitions.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No competitions assigned to you yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {competitions.map(comp => (
            <Card key={comp.id} className="glass-card group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{comp.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{comp.event_name}</p>
                  </div>
                  <Badge variant={comp.status === "ongoing" ? "warning" : comp.status === "completed" ? "success" : "default"}>
                    {comp.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1 mb-4">
                  <p>Max marks: {comp.max_marks}</p>
                  <p>{comp.date} at {comp.time}</p>
                  {comp.venue && <p>{comp.venue}</p>}
                </div>
                <Link href={`/judge/panel/${comp.id}`}>
                  <Button className="w-full gradient-primary">
                    <ExternalLink className="mr-2 h-4 w-4" />Open Panel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
