import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const chestNo = req.nextUrl.searchParams.get("chestNo")
  if (!chestNo) return NextResponse.json({ error: "chestNo required" }, { status: 400 })

  const { data, error } = await supabase
    .from("participants")
    .select("id, name, chest_number, event_id, photo_url, gender, mobile, email, category_id")
    .eq("chest_number", chestNo)
    .single()

  if (error || !data) {
    console.error("Candidate profile error:", error?.message)
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { data: cat } = await supabase
    .from("categories")
    .select("name")
    .eq("id", data.category_id)
    .single()

  const { data: ev } = await supabase
    .from("events")
    .select("name, organization_name, logo_url")
    .eq("id", data.event_id)
    .single()

  return NextResponse.json({
    id: data.id,
    name: data.name,
    chestNo: data.chest_number,
    photoUrl: data.photo_url,
    gender: data.gender,
    mobile: data.mobile,
    email: data.email,
    category: cat?.name || "",
    eventName: ev?.name || "",
    organization: ev?.organization_name || "",
    logoUrl: ev?.logo_url || "",
  })
}
