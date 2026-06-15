import { NextRequest, NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { r2Client, BUCKET_NAME } from "@/lib/r2"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { filename, contentType, folder } = await req.json()
  if (!filename) return NextResponse.json({ error: "Filename is required" }, { status: 400 })

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_")
  const key = `${folder || "uploads"}/${Date.now()}-${safeName}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType || "application/octet-stream",
  })

  const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 })

  return NextResponse.json({
    presignedUrl,
    key,
    publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
  })
}
