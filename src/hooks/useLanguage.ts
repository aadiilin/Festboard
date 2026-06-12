"use client"
import { useState, useCallback } from "react"
import { translations, type Language } from "@/i18n/translations"

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("en")

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
    if (typeof window !== "undefined") {
      localStorage.setItem("festboard-language", lang)
    }
  }, [])

  const t = useCallback(
    (section: string, key: string) => {
      const sectionData = (translations[language] as any)[section]
      if (!sectionData) return key
      return sectionData[key] || key
    },
    [language]
  )

  return { language, setLanguage, t }
}
