"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Image, Upload, Download, Loader2, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"
import type { Event } from "@/types"

interface WinnerResult {
  competition_id: string
  competition_name: string
  participant_id: string
  participant_name: string
  chest_number: string
  marks: number
  position: string
}

interface PosterData {
  templateUrl: string
  templateName: string
  winners: WinnerResult[]
}

const DEFAULT_POSITIONS = {
  name: { x: 50, y: 42 },
  event: { x: 50, y: 55 },
  position: { x: 50, y: 68 },
  chest_no: { x: 50, y: 78 },
  institution: { x: 50, y: 85 },
}

export default function PostersPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [templatePreview, setTemplatePreview] = useState<string | null>(null)
  const [generatedPosters, setGeneratedPosters] = useState<{ name: string; dataUrl: string }[]>([])
  const [posterData, setPosterData] = useState<PosterData | null>(null)
  const [positions, setPositions] = useState(DEFAULT_POSITIONS)
  const [fontSize, setFontSize] = useState(36)
  const [textColor, setTextColor] = useState("#ffffff")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
  }, [])

  const fetchWinners = useCallback(async (eventId: string) => {
    const { data: comps } = await supabase
      .from("competitions")
      .select("id, name")
      .eq("event_id", eventId)

    if (!comps || comps.length === 0) return []

    const compIds = comps.map(c => c.id)
    const compMap = Object.fromEntries(comps.map(c => [c.id, c.name]))

    const { data: scores } = await supabase
      .from("scores")
      .select("competition_id, participant_id, marks")
      .eq("is_approved", true)
      .eq("is_draft", false)
      .in("competition_id", compIds)
      .order("marks", { ascending: false })

    if (!scores || scores.length === 0) return []

    const participantIds = [...new Set(scores.map(s => s.participant_id as string))]
    const { data: participants } = await supabase
      .from("participants")
      .select("id, name, chest_number")
      .in("id", participantIds)

    const partMap = Object.fromEntries(
      (participants || []).map(p => [p.id, { name: p.name, chest_number: p.chest_number }])
    )

    const grouped: Record<string, { compName: string; pname: string; chest: string; marks: number }[]> = {}
    for (const s of scores) {
      const cid = s.competition_id as string
      const pid = s.participant_id as string
      if (!grouped[cid]) grouped[cid] = []
      const part = partMap[pid]
      if (!part) continue
      grouped[cid].push({
        compName: compMap[cid] || "",
        pname: part.name,
        chest: part.chest_number,
        marks: s.marks as number,
      })
    }

    const winners: WinnerResult[] = []
    for (const [, entries] of Object.entries(grouped)) {
      const top3 = entries.slice(0, 3)
      top3.forEach((e, i) => {
        winners.push({
          competition_id: "",
          competition_name: e.compName,
          participant_id: "",
          participant_name: e.pname,
          chest_number: e.chest,
          marks: e.marks,
          position: ["1st", "2nd", "3rd"][i],
        })
      })
    }
    return winners
  }, [supabase])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!selectedEvent) { toast.error("Select an event first"); return }

    const ext = file.name.split(".").pop()
    if (!["png", "jpg", "jpeg"].includes(ext?.toLowerCase() || "")) {
      toast.error("Only PNG and JPEG images are accepted")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "templates")

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const templateUrl = data.url
      setTemplatePreview(templateUrl)

      const winners = await fetchWinners(selectedEvent)
      setPosterData({ templateUrl, templateName: file.name, winners })

      toast.success("Template uploaded successfully")
    } catch {
      toast.error("Upload failed. Please try again.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const renderPosterOnCanvas = useCallback(async (
    templateUrl: string,
    winner: WinnerResult,
    positionsOverride: typeof DEFAULT_POSITIONS,
    fontSizeOverride: number,
    textColorOverride: string
  ): Promise<string> => {
    const img = document.createElement("img")
    img.crossOrigin = "anonymous"
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("Failed to load template"))
      img.src = templateUrl
    })

    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, 0, 0)

    const fSize = Math.round(fontSizeOverride * (canvas.width / 1000))
    ctx.font = `bold ${fSize}px Arial, sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    const vars: Record<string, string> = {
      name: winner.participant_name,
      event: winner.competition_name,
      position: winner.position,
      chest_no: winner.chest_number,
      institution: "",
    }

    for (const [key, text] of Object.entries(vars)) {
      if (!text) continue
      const pos = positionsOverride[key as keyof typeof DEFAULT_POSITIONS]
      const x = Math.round(pos.x / 100 * canvas.width)
      const y = Math.round(pos.y / 100 * canvas.height)

      ctx.save()
      ctx.shadowColor = "rgba(0,0,0,0.7)"
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      ctx.fillStyle = textColorOverride
      ctx.fillText(text, x, y)
      ctx.restore()
    }

    return canvas.toDataURL("image/png")
  }, [])

  const handleGenerateAll = async () => {
    if (!posterData || posterData.winners.length === 0) {
      toast.error("No winners found for this event")
      return
    }

    setGenerating(true)
    try {
      const results: { name: string; dataUrl: string }[] = []
      for (const w of posterData.winners) {
        const dataUrl = await renderPosterOnCanvas(posterData.templateUrl, w, positions, fontSize, textColor)
        results.push({ name: `poster-${w.participant_name.replace(/[^a-zA-Z0-9]/g, "-")}`, dataUrl })
      }
      setGeneratedPosters(results)
      toast.success(`Generated ${results.length} poster${results.length > 1 ? "s" : ""}`)
    } catch {
      toast.error("Generation failed. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const downloadPoster = (name: string, dataUrl: string) => {
    const link = document.createElement("a")
    link.download = `${name}.png`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAll = () => {
    for (const p of generatedPosters) downloadPoster(p.name, p.dataUrl)
    toast.success(`Downloading ${generatedPosters.length} poster${generatedPosters.length > 1 ? "s" : ""}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Posters</h1>
          <p className="text-muted-foreground">Generate winner posters</p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Upload Template</CardTitle>
          <CardDescription>
            Upload a poster template image and auto-generate winner posters. Supported formats: PNG, JPEG.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs">
              <option value="">Select event</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </Select>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button variant="outline" onClick={handleUploadClick} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {uploading ? "Uploading..." : "Upload Template"}
            </Button>
          </div>

          {templatePreview && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Template Preview</h3>
                <span className="text-xs text-muted-foreground">{posterData?.templateName}</span>
              </div>
              <div className="relative max-w-sm rounded-lg overflow-hidden border bg-muted">
                <img src={templatePreview} alt="Template" className="w-full h-auto" />
              </div>

              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Text position settings</summary>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 p-3 border rounded-lg">
                  {(Object.keys(DEFAULT_POSITIONS) as Array<keyof typeof DEFAULT_POSITIONS>).map((key) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs capitalize">{key.replace(/_/g, " ")}</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={positions[key].x}
                          onChange={(e) => setPositions(p => ({ ...p, [key]: { ...p[key], x: Number(e.target.value) } }))}
                          className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
                          placeholder="X%"
                        />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={positions[key].y}
                          onChange={(e) => setPositions(p => ({ ...p, [key]: { ...p[key], y: Number(e.target.value) } }))}
                          className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
                          placeholder="Y%"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-xs">Font size</label>
                    <input
                      type="number"
                      min={8}
                      max={200}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Text color</label>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full h-8 rounded border border-input bg-transparent px-1"
                    />
                  </div>
                </div>
              </details>

              {posterData && posterData.winners.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleGenerateAll} disabled={generating}>
                    {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    {generating ? "Generating..." : `Generate Posters (${posterData.winners.length})`}
                  </Button>
                  {generatedPosters.length > 0 && (
                    <Button variant="outline" onClick={downloadAll}>
                      <Download className="mr-2 h-4 w-4" />Download All
                    </Button>
                  )}
                </div>
              )}

              {posterData && posterData.winners.length === 0 && (
                <p className="text-xs text-muted-foreground">No approved scores found for this event. Add scores and approve them first.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Generated Posters</CardTitle>
          <CardDescription>
            {generatedPosters.length > 0
              ? `${generatedPosters.length} poster${generatedPosters.length > 1 ? "s" : ""} generated`
              : "Upload a template and generate posters to see them here"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatedPosters.length === 0 ? (
            <div className="text-center py-12">
              <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No posters generated yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {generatedPosters.map((p, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="relative bg-muted">
                    <img src={p.dataUrl} alt={p.name} className="w-full h-auto" />
                  </div>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.name.replace("poster-", "")}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => downloadPoster(p.name, p.dataUrl)} className="shrink-0 ml-2">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
