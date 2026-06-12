import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from("scores")
    .upsert(body, { onConflict: "competition_id,participant_id,judge_id" })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { searchParams } = new URL(req.url)
  const competitionId = searchParams.get("competition_id")

  if (!competitionId) {
    return NextResponse.json({ error: "competition_id required" }, { status: 400 })
  }

  const { data } = await supabase
    .from("scores")
    .select("*, participant:participant_id(name, chest_number), judge:judge_id(full_name)")
    .eq("competition_id", competitionId)

  return NextResponse.json(data)
}
