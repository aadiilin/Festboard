import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = createSupabaseAdmin()
  const { id } = await params

  const { data: profile, error } = await admin.from("profiles").select("*").eq("id", id).single()
  if (error || !profile) return NextResponse.json({ error: "Judge not found" }, { status: 404 })

  const { data: assignments } = await admin
    .from("competition_judges")
    .select("competition_id, competitions:competition_id(name, event_id)")
    .eq("judge_id", id)

  const comps = (assignments ?? []).map((a: Record<string, unknown>) => ({
    id: a.competition_id,
    name: (a.competitions as { name: string } | null)?.name ?? "",
    event_id: (a.competitions as { event_id: string } | null)?.event_id ?? "",
  }))

  const eventIds = [...new Set(comps.map((c) => c.event_id))]
  const { data: events } = await admin.from("events").select("id, name").in("id", eventIds)

  return NextResponse.json({
    ...profile,
    competitions: comps,
    events: (events ?? []).map((e: { id: string; name: string }) => ({ id: e.id, name: e.name })),
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = createSupabaseAdmin()
  const { id } = await params
  const { full_name, phone, organization_name, expertise, notes, role, competition_ids } = await req.json()

  const { error } = await admin
    .from("profiles")
    .update({
      full_name: full_name ?? undefined,
      phone: phone ?? undefined,
      organization_name: organization_name ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (competition_ids !== undefined) {
    await admin.from("competition_judges").delete().eq("judge_id", id)
    if (competition_ids.length) {
      const inserts = competition_ids.map((cid: string) => ({ competition_id: cid, judge_id: id }))
      await admin.from("competition_judges").insert(inserts)
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = createSupabaseAdmin()
  const { id } = await params

  const { error: delAuth } = await admin.auth.admin.deleteUser(id)
  if (delAuth) return NextResponse.json({ error: delAuth.message }, { status: 400 })

  const { error: delProfile } = await admin.from("profiles").delete().eq("id", id)
  if (delProfile) return NextResponse.json({ error: delProfile.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
