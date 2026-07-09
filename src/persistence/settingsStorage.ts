const DRAFT_SETTINGS_KEY = 'n-back:draft-settings'

export function loadDraftSettings<T>(): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(DRAFT_SETTINGS_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function saveDraftSettings(settings: unknown): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DRAFT_SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // best-effort persistence — ignore quota/serialization failures
  }
}

export function clearDraftSettings(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(DRAFT_SETTINGS_KEY)
}
