import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const data = searchParams.get("data")
  const size = parseInt(searchParams.get("size") || "300")

  if (!data) {
    return NextResponse.json({ error: "data parameter required" }, { status: 400 })
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: size,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })

    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { data, size } = await req.json()
  if (!data) return NextResponse.json({ error: "data required" }, { status: 400 })

  try {
    const qrDataUrl = await QRCode.toDataURL(data, { width: size || 300, margin: 2 })
    return NextResponse.json({ qrCode: qrDataUrl })
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 })
  }
}
