"use client"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { Upload, Download, FileSpreadsheet, QrCode } from "lucide-react"
import toast from "react-hot-toast"
import type { Event, Participant } from "@/types"

export default function ImportExportPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [participants, setParticipants] = useState<Participant[]>([])
  const [exportingQr, setExportingQr] = useState(false)

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      supabase.from("participants").select("*").eq("event_id", selectedEvent).then(({ data }) => data && setParticipants(data))
    }
  }, [selectedEvent])

  const handleImport = () => {
    toast.success("Excel import ready - connect to Supabase storage")
  }

  const handleExport = () => {
    toast.success("Excel export ready - data will be exported")
  }

  const exportAllQr = useCallback(async () => {
    if (participants.length === 0) return toast.error("No participants to export")
    setExportingQr(true)

    const [{ default: JSZip }, { default: qrcode }] = await Promise.all([
      import("jszip"),
      import("qrcode"),
    ])
    const zip = new JSZip()
    const folder = zip.folder("qr-codes")!
    const size = 300

    for (const p of participants) {
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size + 60
      const ctx = canvas.getContext("2d")
      if (!ctx) continue

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const qrCanvas = document.createElement("canvas")
      qrCanvas.width = size
      qrCanvas.height = size
      await qrcode.toCanvas(qrCanvas, p.chest_number, {
        width: size,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      })
      ctx.drawImage(qrCanvas, 0, 0)

      ctx.fillStyle = "#000000"
      ctx.font = "bold 16px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(p.name, size / 2, size + 25)
      ctx.fillStyle = "#666666"
      ctx.font = "14px sans-serif"
      ctx.fillText(`Chest: ${p.chest_number}`, size / 2, size + 50)

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(b => resolve(b), "image/png"))
      if (blob) folder.file(`${p.chest_number}-${p.name.replace(/[^a-zA-Z0-9]/g, "_")}.png`, blob)
    }

    const zipBlob = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `qr-codes-${selectedEvent}.zip`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${participants.length} QR codes`)
    setExportingQr(false)
  }, [participants, selectedEvent])

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-3xl font-bold">Import / Export</h1><p className="text-muted-foreground">Import and export data using Excel files</p></div>

      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import"><Upload className="mr-2 h-4 w-4" />Import</TabsTrigger>
          <TabsTrigger value="export"><Download className="mr-2 h-4 w-4" />Export</TabsTrigger>
          <TabsTrigger value="qr"><QrCode className="mr-2 h-4 w-4" />QR Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <div className="grid gap-4 sm:grid-cols-3">
            {["Participants", "Teams", "Competitions"].map(item => (
              <Card key={item} className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={handleImport}>
                <CardContent className="flex flex-col items-center py-8">
                  <FileSpreadsheet className="h-10 w-10 text-primary mb-3" />
                  <p className="font-medium">Import {item}</p>
                  <p className="text-xs text-muted-foreground mt-1">Upload Excel file</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="export">
          <div className="grid gap-4 sm:grid-cols-3">
            {["Results", "Scores", "Participants"].map(item => (
              <Card key={item} className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={handleExport}>
                <CardContent className="flex flex-col items-center py-8">
                  <Download className="h-10 w-10 text-emerald-500 mb-3" />
                  <p className="font-medium">Export {item}</p>
                  <p className="text-xs text-muted-foreground mt-1">Download Excel file</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="qr">
          <Card className="glass-card">
            <CardContent className="py-8 space-y-4">
              <div className="flex flex-col items-center text-center">
                <QrCode className="h-12 w-12 text-primary mb-3" />
                <p className="font-medium text-lg">Export QR Codes</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Download all participant QR codes as a ZIP file</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs">
                  <option value="">Select event</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </Select>
                <Button onClick={exportAllQr} disabled={exportingQr || !selectedEvent || participants.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  {exportingQr ? "Generating..." : `Export ${participants.length} QR Codes`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
