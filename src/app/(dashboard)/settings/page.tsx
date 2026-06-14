"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import toast from "react-hot-toast"
import type { Event, PointSystem } from "@/types"

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth()
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [pointSystems, setPointSystems] = useState<PointSystem[]>([])
  const [newPoints, setNewPoints] = useState({ name: "", first: 10, second: 7, third: 5, participation: 1 })
  const [profileForm, setProfileForm] = useState({ full_name: "", organization_name: "", phone: "" })

  useEffect(() => {
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setEvents(data); if (data[0]) setSelectedEvent(data[0].id) }
    })
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        organization_name: profile.organization_name || "",
        phone: profile.phone || "",
      })
    }
  }, [profile])

  useEffect(() => {
    if (selectedEvent) {
      supabase.from("point_systems").select("*").eq("event_id", selectedEvent).then(({ data }) => data && setPointSystems(data))
    }
  }, [selectedEvent])

  const updateProfile = async () => {
    if (!profile) return toast.error("Profile not loaded")
    const { error } = await supabase.from("profiles").update(profileForm).eq("id", profile.id)
    if (error) toast.error(error.message)
    else { toast.success("Profile updated"); refreshProfile() }
  }

  const addPointSystem = async () => {
    if (!newPoints.name.trim() || !selectedEvent) return
    const isDefault = pointSystems.length === 0
    const { error } = await supabase.from("point_systems").insert({ event_id: selectedEvent, ...newPoints, is_default: isDefault })
    if (error) toast.error(error.message)
    else { toast.success("Point system added"); setNewPoints({ name: "", first: 10, second: 7, third: 5, participation: 1 }) }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-3xl font-bold">Settings</h1><p className="text-muted-foreground">Manage your account and event settings</p></div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="points">Point Systems</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="glass-card">
            <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <Input value={profileForm.organization_name} onChange={(e) => setProfileForm({ ...profileForm, organization_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                </div>
              </div>
              <Button onClick={updateProfile}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="points">
          <Card className="glass-card">
            <CardHeader><CardTitle>Point Systems</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="max-w-xs">
                <option value="">Select event</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </Select>

              {pointSystems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Existing Systems</p>
                  {pointSystems.map(ps => (
                    <div key={ps.id} className="flex items-center gap-4 p-3 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium">{ps.name} {ps.is_default && <span className="text-xs text-muted-foreground">(default)</span>}</p>
                        <p className="text-xs text-muted-foreground">1st: {ps.first} | 2nd: {ps.second} | 3rd: {ps.third} | Participation: {ps.participation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Add New Point System</p>
                <div className="grid gap-3 sm:grid-cols-5">
                  <Input placeholder="Name" value={newPoints.name} onChange={(e) => setNewPoints({ ...newPoints, name: e.target.value })} />
                  <Input type="number" placeholder="1st" value={newPoints.first} onChange={(e) => setNewPoints({ ...newPoints, first: Number(e.target.value) })} />
                  <Input type="number" placeholder="2nd" value={newPoints.second} onChange={(e) => setNewPoints({ ...newPoints, second: Number(e.target.value) })} />
                  <Input type="number" placeholder="3rd" value={newPoints.third} onChange={(e) => setNewPoints({ ...newPoints, third: Number(e.target.value) })} />
                  <Input type="number" placeholder="Participation" value={newPoints.participation} onChange={(e) => setNewPoints({ ...newPoints, participation: Number(e.target.value) })} />
                </div>
                <Button className="mt-3" onClick={addPointSystem}>Add System</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
