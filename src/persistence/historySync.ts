import { supabase } from '../auth/supabaseClient'
import type { SessionHistoryRecord } from './historyStorage'
import { createRetryQueue } from './retryQueue'

interface SessionHistoryRow {
  id: string
  timestamp: string
  config: SessionHistoryRecord['config']
  summary: SessionHistoryRecord['summary']
}

function toRecord(row: SessionHistoryRow): SessionHistoryRecord {
  return { id: row.id, timestamp: row.timestamp, config: row.config, summary: row.summary }
}

function toRow(record: SessionHistoryRecord, userId: string) {
  return {
    id: record.id,
    user_id: userId,
    timestamp: record.timestamp,
    config: record.config,
    summary: record.summary,
  }
}

export async function fetchRemoteHistory(userId: string): Promise<SessionHistoryRecord[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('session_history')
    .select('id, timestamp, config, summary')
    .eq('user_id', userId)
  if (error || !data) return null
  return (data as SessionHistoryRow[]).map(toRecord)
}

interface HistoryPushItem {
  userId: string
  record: SessionHistoryRecord
}

async function executeHistoryPush({ userId, record }: HistoryPushItem): Promise<void> {
  const { error } = await supabase!.from('session_history').upsert(toRow(record, userId), { onConflict: 'id' })
  if (error) throw error
}

// Failed pushes are queued (in localStorage) and retried with backoff rather
// than dropped — local storage stays the source of truth in the meantime.
export const historyPushQueue = createRetryQueue<HistoryPushItem>({
  storageKey: 'n-back:history-push-queue',
  getId: ({ record }) => record.id,
  execute: executeHistoryPush,
})

// Upserts a single session-history record.
export async function pushHistoryRecord(userId: string, record: SessionHistoryRecord): Promise<void> {
  if (!supabase) return
  await historyPushQueue.push({ userId, record })
}

export interface MergeResult {
  // History is append-only and records are immutable, so merging is a plain
  // de-dupe by id rather than the per-record last-write-wins used for
  // presets — there's never a conflicting edit to resolve.
  merged: SessionHistoryRecord[]
  // Local records missing remotely — including a device's entire pre-existing
  // history on first login against an empty cloud account — pushed back up
  // to reconcile the server.
  toPush: SessionHistoryRecord[]
}

function timestampMs(value: string): number {
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? 0 : ms
}

export function mergeHistory(local: SessionHistoryRecord[], remote: SessionHistoryRecord[]): MergeResult {
  const localIds = new Set(local.map((record) => record.id))
  const remoteIds = new Set(remote.map((record) => record.id))

  const merged = [...local, ...remote.filter((record) => !localIds.has(record.id))]
  merged.sort((a, b) => timestampMs(a.timestamp) - timestampMs(b.timestamp))

  const toPush = local.filter((record) => !remoteIds.has(record.id))

  return { merged, toPush }
}
