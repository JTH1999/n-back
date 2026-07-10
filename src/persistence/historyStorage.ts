import type { SessionRunnerConfig } from '../hooks/useSessionRunner'
import type { SessionSummary } from '../engine/sessionEngine'

const HISTORY_KEY = 'n-back:session-history'

export interface SessionHistoryRecord {
  timestamp: string
  config: SessionRunnerConfig
  summary: SessionSummary
}

export function loadHistory(): SessionHistoryRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as SessionHistoryRecord[]) : []
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
