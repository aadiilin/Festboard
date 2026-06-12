"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { UserCircle, Hash, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

export default function StudentLoginPage() {
  const [chestNumber, setChestNumber] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Find participant by chest number
    const { data: participant } = await supabase
      .from("participants")
      .select("*, events!inner(*)")
      .eq("chest_number", chestNumber)
      .single()

    if (!participant) {
      toast.error("Invalid chest number")
      setLoading(false)
      return
    }

    // If participant has an email, use it to sign in
    if (participant.email) {
      const { error } = await supabase.auth.signInWithPassword({
        email: participant.email,
        password: password,
      })
      if (error) toast.error(error.message)
      else router.push("/student/dashboard")
    } else {
      toast.error("Contact your event admin for login credentials")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 px-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <UserCircle className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-2xl">Student Login</CardTitle>
          <CardDescription>Enter your chest number and password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Chest Number</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10 font-mono" placeholder="e.g., J001" value={chestNumber} onChange={(e) => setChestNumber(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full gradient-primary" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
