import { useCallback, useEffect, useState } from 'react'
import type { ResolvedTheme, ThemeOverride } from '../config/theme'
import { clearThemeOverride, loadThemeOverride, saveThemeOverride } from '../persistence/themeStorage'

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light'
}

export interface UseThemeResult {
  override: ThemeOverride | null
  resolvedTheme: ResolvedTheme
  setOverride: (theme: ThemeOverride | null) => void
}

export function useTheme(): UseThemeResult {
  const [override, setOverrideState] = useState<ThemeOverride | null>(() => loadThemeOverride())
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme())

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const resolvedTheme = override ?? systemTheme

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  const setOverride = useCallback((theme: ThemeOverride | null) => {
    setOverrideState(theme)
    if (theme === null) {
      clearThemeOverride()
    } else {
      saveThemeOverride(theme)
    }
  }, [])

  return { override, resolvedTheme, setOverride }
}
