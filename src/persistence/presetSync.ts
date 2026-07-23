import { supabase } from '../auth/supabaseClient'
import type { Preset } from '../hooks/usePresets'

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

// Upserts a single preset, un-tombstoning it if a row with this id previously
// existed. Best-effort — local storage stays the source of truth on failure.
export async function pushPreset(userId: string, preset: Preset): Promise<void> {
  if (!supabase) return
  try {
    await supabase.from('presets').upsert(toRow(preset, userId), { onConflict: 'id' })
  } catch {
    // best-effort push — local storage stays the source of truth on failure
  }
}

// Marks a preset as deleted rather than removing the row, so other devices
// that still hold a local copy learn to drop it on their next pull.
export async function pushTombstone(userId: string, presetId: string, deletedAt: string): Promise<void> {
  if (!supabase) return
  try {
    await supabase
      .from('presets')
      .update({ deleted_at: deletedAt, updated_at: deletedAt })
      .eq('user_id', userId)
      .eq('id', presetId)
  } catch {
    // best-effort push — local storage stays the source of truth on failure
  }
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
      merged.push({ id: remoteRecord.id, name: remoteRecord.name, config: remoteRecord.config, updatedAt: remoteRecord.updatedAt })
    } else {
      merged.push(preset)
      toPush.push(preset)
    }
  }

  for (const record of remote) {
    if (localIds.has(record.id) || record.deletedAt) continue
    merged.push({ id: record.id, name: record.name, config: record.config, updatedAt: record.updatedAt })
  }

  return { merged, toPush }
}
