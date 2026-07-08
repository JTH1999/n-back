import { useCallback, useState } from 'react'
import type { Keymap } from '../config/keymap'
import {
  loadLastPresetId,
  loadPresets,
  saveLastPresetId,
  savePresets,
} from '../persistence/presetStorage'
import type { SessionRunnerConfig } from './useSessionRunner'

export interface Preset {
  id: string
  name: string
  config: SessionRunnerConfig
  keymap: Keymap
}

export interface UsePresetsResult {
  presets: Preset[]
  activePresetId: string | null
  savePreset: (name: string, config: SessionRunnerConfig, keymap: Keymap) => void
  loadPreset: (id: string) => Preset | undefined
}

export function usePresets(): UsePresetsResult {
  const [presets, setPresets] = useState<Preset[]>(() => loadPresets<Preset[]>() ?? [])
  const [activePresetId, setActivePresetId] = useState<string | null>(() => loadLastPresetId())

  const savePreset = useCallback((name: string, config: SessionRunnerConfig, keymap: Keymap) => {
    const preset: Preset = { id: crypto.randomUUID(), name, config, keymap }
    setPresets((current) => {
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

  return { presets, activePresetId, savePreset, loadPreset }
}
