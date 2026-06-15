"use client"
import { useRef, useCallback } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"

interface QrCodeCardProps {
  value: string
  label?: string
  size?: number
  className?: string
}

export function QrCodeCard({ value, label, size = 100, className = "" }: QrCodeCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement("a")
    link.download = `qr-${value.replace(/[^a-zA-Z0-9]/g, "-")}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }, [value])

  const printQr = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const win = window.open("", "_blank")
    if (!win) return
    const dataUrl = canvas.toDataURL("image/png")
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>QR Code - ${value}</title>
      <style>
        body { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; font-family:sans-serif; }
        img { max-width:300px; height:auto; }
        h2 { margin-top:16px; }
        p { color:#666; }
      </style>
      </head>
      <body>
        <img src="${dataUrl}" />
        <h2>${label || value}</h2>
        <p>Chest: ${value}</p>
        <script>window.print()<\/script>
      </body>
      </html>
    `)
    win.document.close()
  }, [value, label])

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <QRCodeCanvas
        ref={canvasRef}
        value={value}
        size={size}
        bgColor="#ffffff"
        fgColor="#000000"
        level="M"
      />
      {label && <span className="text-xs text-muted-foreground text-center">{label}</span>}
      <div className="flex gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={downloadPng} title="Download QR">
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={printQr} title="Print QR">
          <Printer className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
