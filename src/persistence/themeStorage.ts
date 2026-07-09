import type { ThemeOverride } from '../config/theme'

const THEME_KEY = 'n-back:theme'

export function loadThemeOverride(): ThemeOverride | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(THEME_KEY)
    return raw === 'light' || raw === 'dark' ? raw : null
  } catch {
    return null
  }
}

export function saveThemeOverride(theme: ThemeOverride): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(THEME_KEY, theme)
  } catch {
    // best-effort persistence — ignore quota/serialization failures
  }
}

export function clearThemeOverride(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(THEME_KEY)
}
