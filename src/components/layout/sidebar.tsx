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
} from "lucide-react"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/events", label: "Events", icon: CalendarDays },
  { href: "/dashboard/categories", label: "Categories", icon: Tags },
  { href: "/dashboard/teams", label: "Teams", icon: Users },
  { href: "/dashboard/participants", label: "Participants", icon: UserCircle },
  { href: "/dashboard/competitions", label: "Competitions", icon: Trophy },
  { href: "/dashboard/judges", label: "Judges", icon: Gavel },
  { href: "/dashboard/scores", label: "Scores", icon: ScrollText },
  { href: "/dashboard/certificates", label: "Certificates", icon: Award },
  { href: "/dashboard/posters", label: "Posters", icon: Image },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/import-export", label: "Import/Export", icon: Download },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function Sidebar({ collapsed, onToggle }: { collapsed?: boolean; onToggle?: (val: boolean) => void }) {
  const pathname = usePathname()
  const [localCollapsed, setLocalCollapsed] = useState(false)
  const isCollapsed = collapsed ?? localCollapsed

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
        {navItems.map((item) => {
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
      </div>
    </aside>
  )
}
