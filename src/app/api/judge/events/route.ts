import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: assignments } = await supabase
    .from("competition_judges")
    .select("competition_id, competitions:competition_id(*, event_id, events:event_id(name, organization_name))")
    .eq("judge_id", user.id)

  type CompRow = Record<string, unknown> & { event_id?: string }
  const competitions: (CompRow & { judge_assignment_id: unknown; event_name: string; organization_name: string })[] =
    (assignments ?? []).map((a: Record<string, unknown>) => {
      const comp = a.competitions as CompRow | null
      const ev = comp?.events as { name: string; organization_name: string } | null
      return {
        ...(comp ?? {}),
        judge_assignment_id: a.id,
        event_name: ev?.name ?? "",
        organization_name: ev?.organization_name ?? "",
      }
    })

  const eventIds = [...new Set(competitions.map((c) => c.event_id).filter(Boolean))] as string[]

  const { data: allParticipants } = await supabase
    .from("participants")
    .select("id, name, chest_number, photo_url, category_id, event_id")
    .in("event_id", eventIds)

  const participants = allParticipants ?? []

  return NextResponse.json({ competitions, participants })
}
