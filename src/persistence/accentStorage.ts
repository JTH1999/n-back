import { ACCENT_COLORS, type AccentColor } from '../config/theme'

const ACCENT_KEY = 'n-back:accent'

export function loadAccent(): AccentColor | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(ACCENT_KEY)
    return ACCENT_COLORS.includes(raw as AccentColor) ? (raw as AccentColor) : null
  } catch {
    return null
  }
}

export function saveAccent(accent: AccentColor): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ACCENT_KEY, accent)
  } catch {
    // best-effort persistence — ignore quota/serialization failures
  }
}
