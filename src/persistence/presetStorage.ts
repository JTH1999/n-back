const PRESETS_KEY = 'n-back:presets'
const LAST_PRESET_ID_KEY = 'n-back:last-preset-id'

export function loadPresets<T>(): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PRESETS_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function savePresets(presets: unknown): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
  } catch {
    // best-effort persistence — ignore quota/serialization failures
  }
}

export function loadLastPresetId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(LAST_PRESET_ID_KEY)
  } catch {
    return null
  }
}

export function saveLastPresetId(id: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LAST_PRESET_ID_KEY, id)
  } catch {
    // best-effort persistence — ignore quota/serialization failures
  }
}
