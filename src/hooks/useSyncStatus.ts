import { useSyncExternalStore } from 'react'
import { historyPushQueue } from '../persistence/historySync'
import { presetPushQueue } from '../persistence/presetSync'
import type { QueueStatus } from '../persistence/retryQueue'
import { useAuth } from './useAuth'

export type SyncStatus = 'synced' | 'pending' | 'failed-retrying'

function combine(a: QueueStatus, b: QueueStatus): SyncStatus {
  if (a === 'retrying' || b === 'retrying') return 'failed-retrying'
  if (a === 'pending' || b === 'pending') return 'pending'
  return 'synced'
}

function subscribe(listener: () => void): () => void {
  const unsubscribePresets = presetPushQueue.subscribe(listener)
  const unsubscribeHistory = historyPushQueue.subscribe(listener)
  return () => {
    unsubscribePresets()
    unsubscribeHistory()
  }
}

function getSnapshot(): SyncStatus {
  return combine(presetPushQueue.getStatus(), historyPushQueue.getStatus())
}

// Sync only happens while logged in, so the indicator has nothing meaningful
// to show otherwise — callers should treat `null` as "don't render".
export function useSyncStatus(): SyncStatus | null {
  const { status: authStatus } = useAuth()
  const syncStatus = useSyncExternalStore(subscribe, getSnapshot)
  return authStatus === 'authenticated' ? syncStatus : null
}
