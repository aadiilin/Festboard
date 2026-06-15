import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  const admin = createSupabaseAdmin()

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("*")
    .eq("role", "judge")
    .order("full_name")

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const enriched = await Promise.all(
    (profiles ?? []).map(async (p) => {
      const { data: assignments } = await admin
        .from("competition_judges")
        .select("competition_id, competitions:competition_id(name, event_id)")
        .eq("judge_id", p.id)

      const comps = (assignments ?? []).map((a: Record<string, unknown>) => ({
        id: a.competition_id,
        name: (a.competitions as { name: string } | null)?.name ?? "",
        event_id: (a.competitions as { event_id: string } | null)?.event_id ?? "",
      }))

      const eventIds = [...new Set(comps.map((c) => c.event_id))]
      const { data: events } = await admin.from("events").select("id, name").in("id", eventIds)

      return {
        ...p,
        competitions: comps,
        events: (events ?? []).map((e: { id: string; name: string }) => ({
          id: e.id,
          name: e.name,
        })),
      }
    })
  )

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const admin = createSupabaseAdmin()
  const { name, email, phone, organization, password, competition_ids } = await req.json()

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
  }

  const { data: existing } = await admin.from("profiles").select("id").eq("email", email.trim()).maybeSingle()
  if (existing) {
    return NextResponse.json({ error: "A judge with this email already exists" }, { status: 409 })
  }

  const createOpts: Record<string, unknown> = {
    email,
    email_confirm: true,
    user_metadata: { full_name: name.trim(), organization: organization || null },
  }
  const genPassword = password || crypto.randomUUID().slice(0, 12)
  createOpts.password = genPassword

  const { data: authUser, error: authError } = await admin.auth.admin.createUser(createOpts)
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    full_name: name.trim(),
    email,
    phone: phone?.trim() || null,
    organization_name: organization?.trim() || null,
    role: "judge",
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  if (competition_ids?.length) {
    const inserts = competition_ids.map((cid: string) => ({
      competition_id: cid,
      judge_id: authUser.user.id,
    }))
    await admin.from("competition_judges").insert(inserts)
  }

  return NextResponse.json({
    success: true,
    id: authUser.user.id,
    email,
    password: genPassword,
  })
}
