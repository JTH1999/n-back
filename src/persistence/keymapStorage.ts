import type { Keymap } from '../config/keymap'

const KEYMAP_KEY = 'n-back:keymap'

export function loadKeymap(): Partial<Keymap> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEYMAP_KEY)
    return raw ? (JSON.parse(raw) as Partial<Keymap>) : null
  } catch {
    return null
  }
}

export function saveKeymap(keymap: Keymap): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEYMAP_KEY, JSON.stringify(keymap))
  } catch {
    // best-effort persistence — ignore quota/serialization failures
  }
}
