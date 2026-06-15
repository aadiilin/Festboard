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
    console.error("Candidate events - participant lookup error:", pErr?.message)
    return NextResponse.json({ error: "Participant not found" }, { status: 404 })
  }

  const { data: scores, error: sErr } = await supabase
    .from("scores")
    .select("competition_id, competitions!inner(id, name, date, time, venue, status, event_id)")
    .eq("participant_id", participant.id)
    .eq("is_approved", true)

  if (sErr) {
    console.error("Candidate events - scores lookup error:", sErr.message)
    return NextResponse.json([])
  }

  if (!scores) return NextResponse.json([])

  const seen = new Set<string>()
  const events: Record<string, any>[] = []
  for (const s of scores) {
    const comp = s.competitions as unknown as { id: string; name: string; date: string; time: string; venue: string; status: string; event_id: string }
    if (seen.has(comp.id)) continue
    seen.add(comp.id)
    events.push({
      id: comp.id,
      name: comp.name,
      date: comp.date,
      time: comp.time,
      venue: comp.venue,
      status: comp.status,
    })
  }

  return NextResponse.json(events)
}
