import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BUILT_IN_PRESETS } from '../config/builtInPresets'
import {
  clearLastPresetId,
  loadLastPresetId,
  loadPresets,
  saveLastPresetId,
  savePresets,
} from '../persistence/presetStorage'
import { fetchRemotePresets, replaceRemotePresets } from '../persistence/presetSync'
import { useAuth } from './useAuth'
import type { SessionRunnerConfig } from './useSessionRunner'

export type PresetConfig = Omit<SessionRunnerConfig, 'volume' | 'muted'>

export interface Preset {
  id: string
  name: string
  config: PresetConfig
  readOnly?: boolean
  updatedAt?: string
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
  const { status, userId } = useAuth()

  const presets = useMemo(() => [...BUILT_IN_PRESETS, ...userPresets], [userPresets])

  const userPresetsRef = useRef(userPresets)
  userPresetsRef.current = userPresets

  // Bumped on every local mutation so an in-flight pull (below) can tell a
  // mutation raced ahead of it and back off instead of clobbering it with
  // stale remote data.
  const mutationVersionRef = useRef(0)

  // Naive tracer-bullet sync: on login, pull the full remote preset set and
  // let it win locally, unless the cloud account is empty and this device
  // already has local presets — then seed the cloud with those instead of
  // discarding them. Fine-grained conflict resolution is a later ticket.
  useEffect(() => {
    if (status !== 'authenticated' || !userId) return
    let cancelled = false
    const versionAtStart = mutationVersionRef.current

    fetchRemotePresets(userId).then((remote) => {
      if (cancelled || remote === null || mutationVersionRef.current !== versionAtStart) return
      const local = userPresetsRef.current
      if (remote.length === 0 && local.length > 0) {
        void replaceRemotePresets(userId, local)
        return
      }
      savePresets(remote)
      setUserPresets(remote)
    })

    return () => {
      cancelled = true
    }
  }, [status, userId])

  const commitUserPresets = useCallback(
    (next: Preset[]) => {
      savePresets(next)
      mutationVersionRef.current += 1
      if (status === 'authenticated' && userId) void replaceRemotePresets(userId, next)
    },
    [status, userId],
  )

  const savePreset = useCallback(
    (name: string, config: PresetConfig) => {
      const preset: Preset = {
        id: crypto.randomUUID(),
        name,
        config: toPresetConfig(config),
        updatedAt: new Date().toISOString(),
      }
      setUserPresets((current) => {
        const next = [...current, preset]
        commitUserPresets(next)
        return next
      })
      setActivePresetId(preset.id)
      saveLastPresetId(preset.id)
    },
    [commitUserPresets],
  )

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

  const renamePreset = useCallback(
    (id: string, name: string) => {
      if (BUILT_IN_PRESETS.some((preset) => preset.id === id)) return
      setUserPresets((current) => {
        const next = current.map((preset) =>
          preset.id === id ? { ...preset, name, updatedAt: new Date().toISOString() } : preset,
        )
        commitUserPresets(next)
        return next
      })
    },
    [commitUserPresets],
  )

  const deletePreset = useCallback(
    (id: string) => {
      if (BUILT_IN_PRESETS.some((preset) => preset.id === id)) return
      setUserPresets((current) => {
        const next = current.filter((preset) => preset.id !== id)
        commitUserPresets(next)
        return next
      })
      setActivePresetId((current) => {
        if (current !== id) return current
        clearLastPresetId()
        return null
      })
    },
    [commitUserPresets],
  )

  return { presets, activePresetId, savePreset, loadPreset, renamePreset, deletePreset }
}
