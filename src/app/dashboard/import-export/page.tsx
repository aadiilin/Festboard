"use client"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { downloadExcel } from "@/lib/excel-export"
import { Upload, Download, FileSpreadsheet, QrCode, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import type { Event, Participant, Category, Competition, Score } from "@/types"

type ExportKey = "participants" | "scores" | "results" | null

export default function ImportExportPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [participants, setParticipants] = useState<Participant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [exportingQr, setExportingQr] = useState(false)
  const [exportingExcel, setExportingExcel] = useState<ExportKey>(null)

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
  }, [])

  useEffect(() => {
    if (!selectedEvent) return
    Promise.all([
      supabase.from("participants").select("*").eq("event_id", selectedEvent),
      supabase.from("categories").select("*").eq("event_id", selectedEvent).order("display_order"),
      supabase.from("competitions").select("*").eq("event_id", selectedEvent).order("date"),
    ]).then(([pRes, cRes, compRes]) => {
      if (pRes.data) setParticipants(pRes.data)
      if (cRes.data) setCategories(cRes.data)
      if (compRes.data) setCompetitions(compRes.data)
    })
  }, [selectedEvent])

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const eventName = events.find((e) => e.id === selectedEvent)?.name ?? "export"

  const exportParticipants = useCallback(async () => {
    if (!participants.length) return toast.error("No participants to export")
    setExportingExcel("participants")
    const rows = participants.map((p, i) => ({
      "#": i + 1,
      "Chest No": p.chest_number,
      Name: p.name,
      Gender: p.gender,
      Category: catMap[p.category_id] ?? p.category_id,
      Mobile: p.mobile ?? "",
      Email: p.email ?? "",
      Address: p.address ?? "",
      Registered: new Date(p.created_at).toLocaleDateString(),
    }))
    downloadExcel(rows, `${eventName}-participants`, "Participants")
    toast.success(`Exported ${rows.length} participants`)
    setExportingExcel(null)
  }, [participants, catMap, eventName])

  const exportScores = useCallback(async () => {
    if (!selectedEvent) return toast.error("Select an event first")
    setExportingExcel("scores")

    const { data: scores } = await supabase
      .from("scores")
      .select("*, participants:participant_id(name, chest_number), competitions:competition_id(name)")
      .in("competition_id", competitions.map((c) => c.id))

    if (!scores?.length) {
      toast.error("No scores found for this event")
      setExportingExcel(null)
      return
    }

    const rows = scores.map((s, i) => ({
      "#": i + 1,
      Competition: (s.competitions as { name: string } | null)?.name ?? s.competition_id,
      Participant: (s.participants as { name: string } | null)?.name ?? s.participant_id,
      "Chest No": (s.participants as { chest_number: string } | null)?.chest_number ?? "",
      Marks: s.marks,
      Approved: s.is_approved ? "Yes" : "No",
      Draft: s.is_draft ? "Yes" : "No",
    }))
    downloadExcel(rows, `${eventName}-scores`, "Scores")
    toast.success(`Exported ${rows.length} scores`)
    setExportingExcel(null)
  }, [selectedEvent, competitions, eventName, supabase])

  const exportResults = useCallback(async () => {
    if (!selectedEvent) return toast.error("Select an event first")
    setExportingExcel("results")

    const { data: scores } = await supabase
      .from("scores")
      .select("*, participants:participant_id(name, chest_number), competitions:competition_id(name)")
      .in("competition_id", competitions.map((c) => c.id))
      .eq("is_approved", true)

    if (!scores?.length) {
      toast.error("No approved scores found for this event")
      setExportingExcel(null)
      return
    }

    const grouped: Record<string, typeof scores> = {}
    for (const s of scores) {
      if (!grouped[s.competition_id]) grouped[s.competition_id] = []
      grouped[s.competition_id].push(s)
    }

    const rows: Record<string, unknown>[] = []
    let rank = 0
    for (const comp of competitions) {
      const compScores = grouped[comp.id]
      if (!compScores) continue
      const sorted = compScores.sort((a, b) => b.marks - a.marks)
      const top = sorted.slice(0, 3)
      top.forEach((s, i) => {
        rank++
        rows.push({
          "#": rank,
          Competition: (s.competitions as { name: string } | null)?.name ?? comp.name,
          Position: ["1st", "2nd", "3rd"][i] ?? "",
          Participant: (s.participants as { name: string } | null)?.name ?? s.participant_id,
          "Chest No": (s.participants as { chest_number: string } | null)?.chest_number ?? "",
          Marks: s.marks,
        })
      })
    }

    downloadExcel(rows, `${eventName}-results`, "Results")
    toast.success(`Exported ${rows.length} results`)
    setExportingExcel(null)
  }, [selectedEvent, competitions, eventName, supabase])

  const handleImport = () => {
    toast.success("Excel import ready - connect to Supabase storage")
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

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground">Event:</label>
        <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs">
          <option value="">Select event</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </Select>
      </div>

      <Tabs defaultValue="export">
        <TabsList>
          <TabsTrigger value="export"><Download className="mr-2 h-4 w-4" />Export</TabsTrigger>
          <TabsTrigger value="import"><Upload className="mr-2 h-4 w-4" />Import</TabsTrigger>
          <TabsTrigger value="qr"><QrCode className="mr-2 h-4 w-4" />QR Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="export">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={exportParticipants}>
              <CardContent className="flex flex-col items-center py-8">
                {exportingExcel === "participants" ? (
                  <Loader2 className="h-10 w-10 text-emerald-500 mb-3 animate-spin" />
                ) : (
                  <Download className="h-10 w-10 text-emerald-500 mb-3" />
                )}
                <p className="font-medium">Export Participants</p>
                <p className="text-xs text-muted-foreground mt-1">{participants.length} participants</p>
              </CardContent>
            </Card>

            <Card className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={exportScores}>
              <CardContent className="flex flex-col items-center py-8">
                {exportingExcel === "scores" ? (
                  <Loader2 className="h-10 w-10 text-blue-500 mb-3 animate-spin" />
                ) : (
                  <Download className="h-10 w-10 text-blue-500 mb-3" />
                )}
                <p className="font-medium">Export Scores</p>
                <p className="text-xs text-muted-foreground mt-1">All scores per competition</p>
              </CardContent>
            </Card>

            <Card className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={exportResults}>
              <CardContent className="flex flex-col items-center py-8">
                {exportingExcel === "results" ? (
                  <Loader2 className="h-10 w-10 text-amber-500 mb-3 animate-spin" />
                ) : (
                  <Download className="h-10 w-10 text-amber-500 mb-3" />
                )}
                <p className="font-medium">Export Results</p>
                <p className="text-xs text-muted-foreground mt-1">Top 3 per competition</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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

        <TabsContent value="qr">
          <Card className="glass-card">
            <CardContent className="py-8 space-y-4">
              <div className="flex flex-col items-center text-center">
                <QrCode className="h-12 w-12 text-primary mb-3" />
                <p className="font-medium text-lg">Export QR Codes</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Download all participant QR codes as a ZIP file</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={exportAllQr} disabled={exportingQr || !selectedEvent || participants.length === 0}>
                  {exportingQr ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
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
