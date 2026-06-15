import { NextRequest, NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { r2Client, BUCKET_NAME, R2_PUBLIC_URL, FOLDERS } from "@/lib/r2"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const folder = (formData.get("folder") as string) || FOLDERS.UPLOADS

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File exceeds 100MB limit" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() || "bin"
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const key = `${folder}/${Date.now()}-${safeName}`

  const buffer = Buffer.from(await file.arrayBuffer())

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  )

  return NextResponse.json({
    url: `${R2_PUBLIC_URL}/${key}`,
    key,
    folder,
    size: file.size,
  })
}
