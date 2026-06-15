import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    let body
    try { body = await req.json() } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const { name, chestNo } = body
    if (!name?.trim() || !chestNo?.trim()) {
      return NextResponse.json({ error: "Name and chest number are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("participants")
      .select("id, name, chest_number, event_id, photo_url, category_id, gender")
      .ilike("name", name.trim())
      .eq("chest_number", chestNo.trim().toUpperCase())

    if (error) {
      console.error("Candidate login DB error:", error.message, error.details, error.hint)
      return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Invalid name or chest number. Please try again." }, { status: 401 })
    }

    const participant = data[0]
    return NextResponse.json({
      id: participant.id,
      name: participant.name,
      chestNo: participant.chest_number,
      eventId: participant.event_id,
      photoUrl: participant.photo_url,
      gender: participant.gender,
    })
  } catch (e) {
    console.error("Candidate login unexpected error:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
