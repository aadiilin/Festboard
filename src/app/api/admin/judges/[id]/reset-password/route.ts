import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

function generatePassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const lower = "abcdefghijklmnopqrstuvwxyz"
  const digits = "0123456789"
  const symbols = "@#$%^&*!?"
  const all = upper + lower + digits + symbols
  let pw = ""
  pw += upper[Math.floor(Math.random() * upper.length)]
  pw += lower[Math.floor(Math.random() * lower.length)]
  pw += digits[Math.floor(Math.random() * digits.length)]
  pw += symbols[Math.floor(Math.random() * symbols.length)]
  for (let i = 0; i < 8; i++) pw += all[Math.floor(Math.random() * all.length)]
  return pw.split("").sort(() => Math.random() - 0.5).join("")
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = createSupabaseAdmin()
  const { id } = await params

  const newPassword = generatePassword()

  const { error } = await admin.auth.admin.updateUserById(id, { password: newPassword })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ password: newPassword })
}
