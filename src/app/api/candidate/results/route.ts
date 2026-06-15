import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const chestNo = req.nextUrl.searchParams.get("chestNo")
  if (!chestNo) return NextResponse.json({ error: "chestNo required" }, { status: 400 })

  const { data: participant, error: pErr } = await supabase
    .from("participants")
    .select("id, event_id")
    .eq("chest_number", chestNo)
    .single()

  if (pErr || !participant) {
    console.error("Candidate results - participant lookup error:", pErr?.message)
    return NextResponse.json({ error: "Participant not found" }, { status: 404 })
  }

  const { data: scores, error: sErr } = await supabase
    .from("scores")
    .select("marks, competition_id, competitions!inner(id, name, max_marks)")
    .eq("participant_id", participant.id)
    .eq("is_approved", true)
    .eq("is_draft", false)
    .order("competition_id")

  if (sErr) {
    console.error("Candidate results - scores lookup error:", sErr.message)
    return NextResponse.json([])
  }

  if (!scores || scores.length === 0) return NextResponse.json([])

  const compIds = [...new Set(scores.map(s => s.competition_id as string))]
  const compScores: Record<string, { marks: number }[]> = {}

  for (const s of scores) {
    const cid = s.competition_id as string
    if (!compScores[cid]) compScores[cid] = []
    compScores[cid].push({ marks: s.marks as number })
  }

  const results: any[] = []
  for (const cid of compIds) {
    const comp = scores.find(s => s.competition_id === cid)?.competitions as unknown as { id: string; name: string; max_marks: number }
    if (!comp) continue

    const participantMarks = compScores[cid][0]?.marks || 0

    let position = "Participated"
    if (compScores[cid].length > 0) {
      const sorted = [...compScores[cid]].sort((a, b) => b.marks - a.marks)
      const rank = sorted.findIndex(s => s.marks === participantMarks) + 1
      if (rank === 1) position = "1st"
      else if (rank === 2) position = "2nd"
      else if (rank === 3) position = "3rd"
    }

    results.push({
      competitionId: cid,
      competitionName: comp.name,
      maxMarks: comp.max_marks,
      marks: participantMarks,
      position,
    })
  }

  return NextResponse.json(results)
}
