import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { isPresetConfigEqual, usePresets, type PresetConfig } from './usePresets'

const config: PresetConfig = {
  n: 2,
  trialCount: 20,
  streams: ['position'],
  displayDurationMs: 500,
  trialLengthMs: 2500,
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
      result.current.savePreset('Warm-up', config)
    })

    expect(result.current.presets).toHaveLength(1)
    expect(result.current.presets[0]).toMatchObject({ name: 'Warm-up', config })
    expect(result.current.activePresetId).toBe(result.current.presets[0].id)
  })

  it('loads a saved preset by id and marks it active', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })
    const id = result.current.presets[0].id

    act(() => {
      result.current.savePreset('Hard mode', { ...config, n: 4 })
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

  it('deletes a preset by id', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })
    const id = result.current.presets[0].id

    act(() => {
      result.current.deletePreset(id)
    })

    expect(result.current.presets).toEqual([])
  })

  it('clears the active preset id when the active preset is deleted', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })
    const id = result.current.presets[0].id

    act(() => {
      result.current.deletePreset(id)
    })

    expect(result.current.activePresetId).toBeNull()
  })

  it('leaves the active preset id untouched when a different preset is deleted', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })
    const warmUpId = result.current.presets[0].id
    act(() => {
      result.current.savePreset('Hard mode', { ...config, n: 4 })
    })

    act(() => {
      result.current.deletePreset(warmUpId)
    })

    expect(result.current.activePresetId).not.toBe(warmUpId)
    expect(result.current.presets).toHaveLength(1)
  })

  it('persists deletions across remounts', () => {
    const { result, unmount } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })
    const id = result.current.presets[0].id
    act(() => {
      result.current.deletePreset(id)
    })
    unmount()

    const { result: remounted } = renderHook(() => usePresets())

    expect(remounted.current.presets).toEqual([])
  })

  it('persists the saved preset list and active id across remounts', () => {
    const { result, unmount } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })
    const id = result.current.presets[0].id
    unmount()

    const { result: remounted } = renderHook(() => usePresets())

    expect(remounted.current.presets).toHaveLength(1)
    expect(remounted.current.activePresetId).toBe(id)
  })

  it('strips stray volume/muted fields from an old-shape preset already in localStorage', () => {
    const legacyPreset = {
      id: 'legacy-1',
      name: 'Legacy',
      config: { ...config, volume: 0.3, muted: true },
      keymap: { position: 'a', shape: 's', color: 'd', letter: 'f' },
    }
    window.localStorage.setItem('n-back:presets', JSON.stringify([legacyPreset]))

    const { result } = renderHook(() => usePresets())

    expect(result.current.presets).toHaveLength(1)
    expect(result.current.presets[0].config).toEqual(config)

    let loaded: ReturnType<typeof result.current.loadPreset>
    act(() => {
      loaded = result.current.loadPreset('legacy-1')
    })

    expect(loaded?.config).not.toHaveProperty('volume')
    expect(loaded?.config).not.toHaveProperty('muted')
  })
})

describe('isPresetConfigEqual', () => {
  it('returns true for identical configs', () => {
    expect(isPresetConfigEqual(config, { ...config })).toBe(true)
  })

  it('returns false when a scalar field differs', () => {
    expect(isPresetConfigEqual(config, { ...config, n: 3 })).toBe(false)
  })

  it('returns false when the streams array differs', () => {
    expect(isPresetConfigEqual(config, { ...config, streams: ['position', 'color'] })).toBe(false)
  })

  it('returns false when a nested adaptive field differs', () => {
    expect(
      isPresetConfigEqual(config, { ...config, adaptive: { ...config.adaptive, enabled: true } }),
    ).toBe(false)
  })

  it('ignores extraneous fields like volume/muted', () => {
    const withExtras = { ...config, volume: 0.4, muted: true } as PresetConfig
    expect(isPresetConfigEqual(config, withExtras)).toBe(true)
  })
})
