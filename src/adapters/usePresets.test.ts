import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_KEYMAP } from '../config/keymap'
import { getActivePreset, usePresets } from './usePresets'
import type { SessionRunnerConfig } from './useSessionRunner'

const config: SessionRunnerConfig = {
  n: 2,
  trialCount: 20,
  streams: ['position'],
  displayDurationMs: 500,
  trialLengthMs: 2500,
  volume: 1,
  muted: false,
  liveFeedback: false,
  adaptive: { enabled: false, lowerThreshold: 0.5, upperThreshold: 0.8 },
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('usePresets', () => {
  it('starts with no saved presets and no active preset', () => {
    const { result } = renderHook(() => usePresets())

    expect(result.current.presets).toEqual([])
    expect(result.current.activePresetId).toBeNull()
  })

  it('saves the current settings as a named preset and marks it active', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config, DEFAULT_KEYMAP)
    })

    expect(result.current.presets).toHaveLength(1)
    expect(result.current.presets[0]).toMatchObject({ name: 'Warm-up', config, keymap: DEFAULT_KEYMAP })
    expect(result.current.activePresetId).toBe(result.current.presets[0].id)
  })

  it('loads a saved preset by id and marks it active', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config, DEFAULT_KEYMAP)
    })
    const id = result.current.presets[0].id

    act(() => {
      result.current.savePreset('Hard mode', { ...config, n: 4 }, DEFAULT_KEYMAP)
    })
    expect(result.current.activePresetId).not.toBe(id)

    let loaded
    act(() => {
      loaded = result.current.loadPreset(id)
    })

    expect(loaded).toMatchObject({ name: 'Warm-up' })
    expect(result.current.activePresetId).toBe(id)
  })

  it('returns undefined when loading an id that does not exist', () => {
    const { result } = renderHook(() => usePresets())

    let loaded
    act(() => {
      loaded = result.current.loadPreset('missing')
    })

    expect(loaded).toBeUndefined()
    expect(result.current.activePresetId).toBeNull()
  })

  it('persists the saved preset list and active id across remounts', () => {
    const { result, unmount } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config, DEFAULT_KEYMAP)
    })
    const id = result.current.presets[0].id
    unmount()

    const { result: remounted } = renderHook(() => usePresets())

    expect(remounted.current.presets).toHaveLength(1)
    expect(remounted.current.activePresetId).toBe(id)
  })
})

describe('getActivePreset', () => {
  it('returns null when no preset has ever been saved', () => {
    expect(getActivePreset()).toBeNull()
  })

  it('returns the most recently saved or loaded preset', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config, DEFAULT_KEYMAP)
    })

    expect(getActivePreset()).toMatchObject({ name: 'Warm-up' })
  })
})
