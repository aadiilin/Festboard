import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { competition_id, participant_id, marks } = await req.json()

  if (!competition_id || !participant_id || marks === undefined) {
    return NextResponse.json({ error: "competition_id, participant_id, and marks are required" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("scores")
    .select("id, marks")
    .eq("competition_id", competition_id)
    .eq("participant_id", participant_id)
    .eq("judge_id", user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("scores")
      .update({ marks, updated_at: new Date().toISOString(), is_draft: false })
      .eq("id", existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, updated: true })
  }

  const { error } = await supabase.from("scores").insert({
    competition_id,
    participant_id,
    judge_id: user.id,
    marks,
    is_draft: false,
    is_approved: false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, created: true })
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("scores")
    .select("*, participants:participant_id(name, chest_number), competitions:competition_id(name)")
    .eq("judge_id", user.id)

  return NextResponse.json(data ?? [])
}
