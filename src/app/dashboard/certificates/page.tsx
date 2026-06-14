"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Download, Award } from "lucide-react"
import type { Event, Certificate } from "@/types"

export default function CertificatesPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [certificates, setCertificates] = useState<(Certificate & { participant_name?: string; comp_name?: string })[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const supabase = createClient()

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
  }, [])

  useEffect(() => {
    if (selectedEvent) loadCertificates()
  }, [selectedEvent])

  const loadCertificates = async () => {
    const { data } = await supabase
      .from("certificates")
      .select("*, participant:participant_id(name), competition:competition_id(name)")
      .eq("event_id", selectedEvent)
    if (data) {
      type CertRow = Certificate & { participant?: { name: string } | null; competition?: { name: string } | null }
      setCertificates(data.map((d: CertRow) => ({ ...d, participant_name: d.participant?.name, comp_name: d.competition?.name })))
    }
  }

  const typeVariant: Record<Certificate["type"], "default" | "success" | "secondary"> = {
    winner: "success", runner_up: "default", participation: "secondary", merit: "default",
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Certificates</h1><p className="text-muted-foreground">View and download certificates</p></div>

      <Card className="glass-card">
        <CardContent className="pt-6">
          <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs mb-4">
            <option value="">Select event</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </Select>

          {!selectedEvent ? (
            <p className="text-muted-foreground text-center py-8">Select an event to view certificates.</p>
          ) : certificates.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No certificates generated yet.</p>
              <p className="text-sm text-muted-foreground">Certificates are auto-generated when scores are approved.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.participant_name}</TableCell>
                    <TableCell>{c.comp_name || "-"}</TableCell>
                    <TableCell><Badge variant={typeVariant[c.type]}>{c.type}</Badge></TableCell>
                    <TableCell>{new Date(c.issued_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm"><Download className="mr-1 h-3 w-3" />PDF</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
