"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getSession, type CandidateSession } from "@/lib/candidate-session"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QRCodeCanvas } from "qrcode.react"
import { Download, Share2 } from "lucide-react"
import toast from "react-hot-toast"

export default function CandidateQrPage() {
  const router = useRouter()
  const [session, setSession] = useState<CandidateSession | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace("/candidate"); return }
    setSession(s)
  }, [])

  const downloadQr = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !session) return
    const link = document.createElement("a")
    link.download = `qr-${session.chestNo}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
    toast.success("QR code downloaded")
  }, [session])

  const shareQr = useCallback(async () => {
    const s = session
    if (!s) return
    if (!navigator.share) {
      return navigator.clipboard?.writeText(s.chestNo).then(() => toast.success("Chest number copied"))
    }
    try {
      await navigator.share({
        title: `${s.name} - QR Code`,
        text: `View results for ${s.name} (Chest: ${s.chestNo})`,
        url: `${window.location.origin}/candidate?chest=${s.chestNo}`,
      })
    } catch { /* user cancelled */ }
  }, [session])

  if (!session) return null

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">My QR Code</h1>

      <Card className="glass-card">
        <CardContent className="flex flex-col items-center py-8">
          <QRCodeCanvas
            ref={canvasRef}
            value={session.chestNo}
            size={240}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
            includeMargin
          />
          <p className="text-xl font-mono font-bold mt-4">{session.chestNo}</p>
          <p className="text-sm text-muted-foreground">{session.name}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-12" onClick={downloadQr}>
          <Download className="mr-2 h-5 w-5" />Download
        </Button>
        <Button variant="outline" className="h-12" onClick={shareQr}>
          <Share2 className="mr-2 h-5 w-5" />Share
        </Button>
      </div>

      <Card className="glass-card">
        <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">How to use</p>
          <p>Show this QR code at event check-in desks to verify your identity.</p>
          <p>Organizers can scan this code to view your registration and results.</p>
        </CardContent>
      </Card>
    </div>
  )
}
