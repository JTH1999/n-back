import { supabase } from '../auth/supabaseClient'
import type { Preset } from '../hooks/usePresets'
import { createRetryQueue } from './retryQueue'

interface PresetRow {
  id: string
  name: string
  config: Preset['config']
  updated_at: string
  deleted_at: string | null
}

export interface RemotePresetRecord {
  id: string
  name: string
  config: Preset['config']
  updatedAt: string
  deletedAt: string | null
}

function toRecord(row: PresetRow): RemotePresetRecord {
  return { id: row.id, name: row.name, config: row.config, updatedAt: row.updated_at, deletedAt: row.deleted_at }
}

function toPreset(record: RemotePresetRecord): Preset {
  return { id: record.id, name: record.name, config: record.config, updatedAt: record.updatedAt }
}

function toRow(preset: Preset, userId: string) {
  return {
    id: preset.id,
    user_id: userId,
    name: preset.name,
    config: preset.config,
    updated_at: preset.updatedAt ?? new Date().toISOString(),
    deleted_at: null,
  }
}

export async function fetchRemotePresets(userId: string): Promise<RemotePresetRecord[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('presets')
    .select('id, name, config, updated_at, deleted_at')
    .eq('user_id', userId)
  if (error || !data) return null
  return (data as PresetRow[]).map(toRecord)
}

type PresetPushItem =
  | { kind: 'upsert'; userId: string; preset: Preset }
  | { kind: 'tombstone'; userId: string; presetId: string; deletedAt: string }

function presetPushItemId(item: PresetPushItem): string {
  return item.kind === 'upsert' ? item.preset.id : item.presetId
}

async function executePresetPush(item: PresetPushItem): Promise<void> {
  if (item.kind === 'upsert') {
    const { error } = await supabase!.from('presets').upsert(toRow(item.preset, item.userId), { onConflict: 'id' })
    if (error) throw error
    return
  }
  const { error } = await supabase!
    .from('presets')
    .update({ deleted_at: item.deletedAt, updated_at: item.deletedAt })
    .eq('user_id', item.userId)
    .eq('id', item.presetId)
  if (error) throw error
}

// Failed pushes are queued (in localStorage) and retried with backoff rather
// than dropped — local storage stays the source of truth in the meantime.
export const presetPushQueue = createRetryQueue<PresetPushItem>({
  storageKey: 'n-back:preset-push-queue',
  getId: presetPushItemId,
  execute: executePresetPush,
})

// Upserts a single preset, un-tombstoning it if a row with this id previously
// existed.
export async function pushPreset(userId: string, preset: Preset): Promise<void> {
  if (!supabase) return
  await presetPushQueue.push({ kind: 'upsert', userId, preset })
}

// Marks a preset as deleted rather than removing the row, so other devices
// that still hold a local copy learn to drop it on their next pull.
export async function pushTombstone(userId: string, presetId: string, deletedAt: string): Promise<void> {
  if (!supabase) return
  await presetPushQueue.push({ kind: 'tombstone', userId, presetId, deletedAt })
}

export interface MergeResult {
  // The presets that should now be visible locally: local wins on newer
  // updatedAt, remote wins on newer updatedAt, and tombstoned presets are
  // dropped even if the local copy looks more recently edited.
  merged: Preset[]
  // Local presets that are missing remotely or newer than their remote
  // counterpart, and so should be pushed back up to reconcile the server.
  toPush: Preset[]
}

function updatedAtMs(value: string | undefined): number {
  if (!value) return 0
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? 0 : ms
}

export function mergePresets(local: Preset[], remote: RemotePresetRecord[]): MergeResult {
  const remoteById = new Map(remote.map((record) => [record.id, record]))
  const localIds = new Set(local.map((preset) => preset.id))
  const merged: Preset[] = []
  const toPush: Preset[] = []

  for (const preset of local) {
    const remoteRecord = remoteById.get(preset.id)
    if (!remoteRecord) {
      merged.push(preset)
      toPush.push(preset)
      continue
    }
    if (remoteRecord.deletedAt) {
      continue
    }
    if (updatedAtMs(remoteRecord.updatedAt) > updatedAtMs(preset.updatedAt)) {
      merged.push(toPreset(remoteRecord))
    } else {
      merged.push(preset)
      toPush.push(preset)
    }
  }

  for (const record of remote) {
    if (localIds.has(record.id) || record.deletedAt) continue
    merged.push(toPreset(record))
  }

  return { merged, toPush }
}
