import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_ACCENT, type AccentColor } from '../config/theme'
import { loadAccent, saveAccent } from '../persistence/accentStorage'

export interface UseAccentResult {
  accent: AccentColor
  setAccent: (accent: AccentColor) => void
}

export function useAccent(): UseAccentResult {
  const [accent, setAccentState] = useState<AccentColor>(() => loadAccent() ?? DEFAULT_ACCENT)

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-accent', accent)
  }, [accent])

  const setAccent = useCallback((next: AccentColor) => {
    setAccentState(next)
    saveAccent(next)
  }, [])

  return { accent, setAccent }
}
