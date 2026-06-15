"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { Settings as SettingsIcon, Save, Loader2, LogOut } from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [appName, setAppName] = useState("FestBoard")
  const [saving, setSaving] = useState(false)

  const saveSettings = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    toast.success("Settings saved")
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-3xl font-bold flex items-center gap-2"><SettingsIcon className="h-7 w-7" /> Settings</h1><p className="text-muted-foreground">Configure application settings</p></div>

      <Card className="glass-card">
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Event Title</Label><Input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="Your event name" /></div>
          <Button onClick={saveSettings} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{saving ? "Saving..." : "Save Settings"}</Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">You are logged in as an administrator.</p>
          <Button variant="destructive" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
        </CardContent>
      </Card>
    </div>
  )
}
