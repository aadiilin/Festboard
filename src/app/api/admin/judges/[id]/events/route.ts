import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = createSupabaseAdmin()
  const { id } = await params

  const { data: assignments } = await admin
    .from("competition_judges")
    .select("competition_id, competitions:competition_id(name, event_id)")
    .eq("judge_id", id)

  if (!assignments?.length) return NextResponse.json([])

  const eventIds = [...new Set(assignments.map((a: Record<string, unknown>) =>
    (a.competitions as { event_id: string } | null)?.event_id ?? ""
  ).filter(Boolean))]

  const { data: events } = await admin.from("events").select("id, name").in("id", eventIds)

  return NextResponse.json(events ?? [])
}
