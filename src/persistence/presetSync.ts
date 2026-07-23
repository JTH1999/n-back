import { supabase } from '../auth/supabaseClient'
import type { Preset } from '../hooks/usePresets'

interface PresetRow {
  id: string
  name: string
  config: Preset['config']
  updated_at: string
}

function toPreset(row: PresetRow): Preset {
  return { id: row.id, name: row.name, config: row.config, updatedAt: row.updated_at }
}

function toRow(preset: Preset, userId: string) {
  return {
    id: preset.id,
    user_id: userId,
    name: preset.name,
    config: preset.config,
    updated_at: preset.updatedAt ?? new Date().toISOString(),
  }
}

export async function fetchRemotePresets(userId: string): Promise<Preset[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('presets')
    .select('id, name, config, updated_at')
    .eq('user_id', userId)
  if (error || !data) return null
  return (data as PresetRow[]).map(toPreset)
}

// Naive tracer-bullet sync: replace the user's entire remote preset set with
// the current local list. Fine-grained conflict resolution is a later ticket.
export async function replaceRemotePresets(userId: string, presets: Preset[]): Promise<void> {
  if (!supabase) return
  try {
    const localIds = new Set(presets.map((preset) => preset.id))
    const { data: existing } = await supabase.from('presets').select('id').eq('user_id', userId)
    const staleIds = (existing ?? [])
      .map((row: { id: string }) => row.id)
      .filter((id: string) => !localIds.has(id))

    if (staleIds.length > 0) {
      await supabase.from('presets').delete().eq('user_id', userId).in('id', staleIds)
    }
    if (presets.length > 0) {
      await supabase
        .from('presets')
        .upsert(
          presets.map((preset) => toRow(preset, userId)),
          { onConflict: 'id' },
        )
    }
  } catch {
    // best-effort push — local storage stays the source of truth on failure
  }
}
