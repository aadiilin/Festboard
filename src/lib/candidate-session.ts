export interface CandidateSession {
  chestNo: string
  name: string
  participantId: string
  eventId: string
  loggedIn: true
}

const KEY = "festboard_candidate"

export function getSession(): CandidateSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data?.loggedIn) return data as CandidateSession
    return null
  } catch { return null }
}

export function setSession(data: CandidateSession): void {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function clearSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(KEY)
}
