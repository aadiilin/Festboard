import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

  const admin = createSupabaseAdmin()
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .eq("role", "judge")
    .single()

  if (!profile) {
    await supabase.auth.signOut()
    return NextResponse.json({ error: "Access denied. Not a judge account." }, { status: 403 })
  }

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      full_name: profile.full_name,
      organization_name: profile.organization_name,
    },
  })
}
