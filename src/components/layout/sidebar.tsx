"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  CalendarDays,
  Tags,
  Users,
  UserCircle,
  Trophy,
  Gavel,
  ScrollText,
  Award,
  Image,
  BarChart3,
  Settings,
  Download,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Languages,
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import type { Role } from "@/types"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "event_admin", "judge"] },
  { href: "/dashboard/events", label: "Events", icon: CalendarDays, roles: ["super_admin", "event_admin"] },
  { href: "/dashboard/categories", label: "Categories", icon: Tags, roles: ["super_admin", "event_admin"] },
  { href: "/dashboard/teams", label: "Teams", icon: Users, roles: ["super_admin", "event_admin"] },
  { href: "/dashboard/participants", label: "Participants", icon: UserCircle, roles: ["super_admin", "event_admin"] },
  { href: "/dashboard/competitions", label: "Competitions", icon: Trophy, roles: ["super_admin", "event_admin", "judge"] },
  { href: "/dashboard/judges", label: "Judges", icon: Gavel, roles: ["super_admin", "event_admin"] },
  { href: "/dashboard/scores", label: "Scores", icon: ScrollText, roles: ["super_admin", "event_admin", "judge"] },
  { href: "/dashboard/certificates", label: "Certificates", icon: Award, roles: ["super_admin", "event_admin"] },
  { href: "/dashboard/posters", label: "Posters", icon: Image, roles: ["super_admin", "event_admin"] },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, roles: ["super_admin", "event_admin"] },
  { href: "/dashboard/import-export", label: "Import/Export", icon: Download, roles: ["super_admin", "event_admin"] },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["super_admin", "event_admin"] },
]

export function Sidebar({ collapsed, onToggle }: { collapsed?: boolean; onToggle?: (val: boolean) => void }) {
  const pathname = usePathname()
  const [localCollapsed, setLocalCollapsed] = useState(false)
  const isCollapsed = collapsed ?? localCollapsed
  const { profile, signOut } = useAuth()

  if (!profile) return null

  const filteredNav = navItems.filter((item) => item.roles.includes(profile.role as Role))

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link href="/dashboard" className={cn("flex items-center gap-2 font-bold text-lg", isCollapsed && "justify-center")}>
          <Trophy className="h-6 w-6 text-sidebar-primary" />
          {!isCollapsed && <span>FestBoard</span>}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                    isCollapsed && "justify-center px-0"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="text-sm">{item.label}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => { const newVal = !isCollapsed; setLocalCollapsed(newVal); onToggle?.(newVal) }}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!isCollapsed && <span className="text-sm">Collapse</span>}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="text-sm">Sign Out</span>}
        </Button>
      </div>
    </aside>
  )
}
