import { useCallback, useMemo, useState } from 'react'
import { BUILT_IN_PRESETS } from '../config/builtInPresets'
import {
  clearLastPresetId,
  loadLastPresetId,
  loadPresets,
  saveLastPresetId,
  savePresets,
} from '../persistence/presetStorage'
import type { SessionRunnerConfig } from './useSessionRunner'

export type PresetConfig = Omit<SessionRunnerConfig, 'volume' | 'muted'>

export interface Preset {
  id: string
  name: string
  config: PresetConfig
  readOnly?: boolean
}

export interface UsePresetsResult {
  presets: Preset[]
  activePresetId: string | null
  savePreset: (name: string, config: PresetConfig) => void
  loadPreset: (id: string) => Preset | undefined
  renamePreset: (id: string, name: string) => void
  deletePreset: (id: string) => void
}

function toPresetConfig(config: PresetConfig): PresetConfig {
  const { n, trialCount, streams, matchRate, displayDurationMs, trialLengthMs, liveFeedback, adaptive } =
    config
  return { n, trialCount, streams, matchRate, displayDurationMs, trialLengthMs, liveFeedback, adaptive }
}

function sanitizePreset(preset: Preset): Preset {
  return { ...preset, config: toPresetConfig(preset.config) }
}

export function isPresetConfigEqual(a: PresetConfig, b: PresetConfig): boolean {
  return JSON.stringify(toPresetConfig(a)) === JSON.stringify(toPresetConfig(b))
}

export function usePresets(): UsePresetsResult {
  const [userPresets, setUserPresets] = useState<Preset[]>(() =>
    (loadPresets<Preset[]>() ?? []).map(sanitizePreset),
  )
  const [activePresetId, setActivePresetId] = useState<string | null>(() => loadLastPresetId())

  const presets = useMemo(() => [...BUILT_IN_PRESETS, ...userPresets], [userPresets])

  const savePreset = useCallback((name: string, config: PresetConfig) => {
    const preset: Preset = { id: crypto.randomUUID(), name, config: toPresetConfig(config) }
    setUserPresets((current) => {
      const next = [...current, preset]
      savePresets(next)
      return next
    })
    setActivePresetId(preset.id)
    saveLastPresetId(preset.id)
  }, [])

  const loadPreset = useCallback(
    (id: string) => {
      const preset = presets.find((candidate) => candidate.id === id)
      if (!preset) return undefined
      setActivePresetId(id)
      saveLastPresetId(id)
      return preset
    },
    [presets],
  )

  const renamePreset = useCallback((id: string, name: string) => {
    if (BUILT_IN_PRESETS.some((preset) => preset.id === id)) return
    setUserPresets((current) => {
      const next = current.map((preset) => (preset.id === id ? { ...preset, name } : preset))
      savePresets(next)
      return next
    })
  }, [])

  const deletePreset = useCallback((id: string) => {
    if (BUILT_IN_PRESETS.some((preset) => preset.id === id)) return
    setUserPresets((current) => {
      const next = current.filter((preset) => preset.id !== id)
      savePresets(next)
      return next
    })
    setActivePresetId((current) => {
      if (current !== id) return current
      clearLastPresetId()
      return null
    })
  }, [])

  return { presets, activePresetId, savePreset, loadPreset, renamePreset, deletePreset }
}
