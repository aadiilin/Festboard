"use client"
import { ModeToggle } from "./mode-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/hooks/useLanguage"
import { Globe } from "lucide-react"
import type { Language } from "@/i18n/translations"

export function Header() {
  const { language, setLanguage } = useLanguage()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex-1" />

      {/* Language Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Globe className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Language</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(["en", "ml", "ar"] as Language[]).map((lang) => (
            <DropdownMenuItem key={lang} onClick={() => setLanguage(lang)} className={language === lang ? "bg-accent" : ""}>
              {lang === "en" ? "English" : lang === "ml" ? "മലയാളം" : "العربية"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ModeToggle />
    </header>
  )
}
