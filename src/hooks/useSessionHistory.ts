import { useCallback, useEffect, useRef, useState } from 'react'
import type { SessionSummary } from '../engine/sessionEngine'
import { appendHistoryRecord, loadHistory, replaceHistory, type SessionHistoryRecord } from '../persistence/historyStorage'
import { fetchRemoteHistory, mergeHistory, pushHistoryRecord } from '../persistence/historySync'
import { useAuth } from './useAuth'
import type { SessionRunnerConfig } from './useSessionRunner'

export interface UseSessionHistoryResult {
  history: SessionHistoryRecord[]
  recordSession: (config: SessionRunnerConfig, summary: SessionSummary) => SessionHistoryRecord
  refresh: () => void
}

export function useSessionHistory(): UseSessionHistoryResult {
  const [history, setHistory] = useState<SessionHistoryRecord[]>(() => loadHistory())
  const { status, userId } = useAuth()
  const historyRef = useRef(history)
  historyRef.current = history

  // On login, pull the remote history and merge it against local state by id.
  // History is append-only and records never change once created, so unlike
  // presets there's no last-write-wins to resolve — a record either exists
  // already or it doesn't. Anything local the remote doesn't have yet —
  // including a device's entire pre-existing history on first login against
  // an empty cloud account — is pushed back up to reconcile the server.
  useEffect(() => {
    if (status !== 'authenticated' || !userId) return
    let cancelled = false

    fetchRemoteHistory(userId).then((remote) => {
      if (cancelled || remote === null) return
      const local = historyRef.current
      const { merged, toPush } = mergeHistory(local, remote)
      if (merged.length !== local.length) {
        replaceHistory(merged)
        setHistory(merged)
      }
      for (const record of toPush) void pushHistoryRecord(userId, record)
    })

    return () => {
      cancelled = true
    }
  }, [status, userId])

  const recordSession = useCallback(
    (config: SessionRunnerConfig, summary: SessionSummary): SessionHistoryRecord => {
      const record: SessionHistoryRecord = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), config, summary }
      appendHistoryRecord(record)
      setHistory((current) => [...current, record])
      if (status === 'authenticated' && userId) void pushHistoryRecord(userId, record)
      return record
    },
    [status, userId],
  )

  const refresh = useCallback(() => {
    setHistory(loadHistory())
  }, [])

  return { history, recordSession, refresh }
}
