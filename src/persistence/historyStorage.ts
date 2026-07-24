import type { SessionRunnerConfig } from '../hooks/useSessionRunner'
import type { SessionSummary } from '../engine/sessionEngine'

const HISTORY_KEY = 'n-back:session-history'

export interface SessionHistoryRecord {
  id: string
  timestamp: string
  config: SessionRunnerConfig
  summary: SessionSummary
}

// Backfills a client-generated id onto any record (local or imported) that
// was persisted before ids existed, so every device's pre-existing history
// can sync by id too. Returns the same reference when an id already exists.
export function ensureRecordId<T extends { id?: unknown }>(value: T): T & { id: string } {
  return typeof value.id === 'string' && value.id
    ? (value as T & { id: string })
    : { ...value, id: crypto.randomUUID() }
}

export function loadHistory(): SessionHistoryRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SessionHistoryRecord[]
    const records = parsed.map(ensureRecordId)
    if (records.some((record, index) => record !== parsed[index])) {
      replaceHistory(records)
    }
    return records
  } catch {
    return []
  }
}

export function appendHistoryRecord(record: SessionHistoryRecord): void {
  if (typeof window === 'undefined') return
  try {
    const history = loadHistory()
    history.push(record)
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // best-effort persistence — ignore quota/serialization failures
  }
}

export function replaceHistory(history: SessionHistoryRecord[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // best-effort persistence — ignore quota/serialization failures
  }
}
