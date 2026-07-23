import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BUILT_IN_PRESETS } from '../config/builtInPresets'

const mockUseAuth = vi.fn()
const mockFetchRemotePresets = vi.fn()
const mockPushPreset = vi.fn()
const mockPushTombstone = vi.fn()

vi.mock('./useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}))
vi.mock('../persistence/presetSync', async () => {
  const actual = await vi.importActual<typeof import('../persistence/presetSync')>('../persistence/presetSync')
  return {
    mergePresets: actual.mergePresets,
    fetchRemotePresets: (...args: unknown[]) => mockFetchRemotePresets(...args),
    pushPreset: (...args: unknown[]) => mockPushPreset(...args),
    pushTombstone: (...args: unknown[]) => mockPushTombstone(...args),
  }
})

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

const BUILT_IN_COUNT = BUILT_IN_PRESETS.length

function userPresetsOf(result: { current: ReturnType<typeof usePresets> }) {
  return result.current.presets.slice(BUILT_IN_COUNT)
}

beforeEach(() => {
  window.localStorage.clear()
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ status: 'unauthenticated', userId: null })
  mockFetchRemotePresets.mockResolvedValue(null)
  mockPushPreset.mockResolvedValue(undefined)
  mockPushTombstone.mockResolvedValue(undefined)
})

describe('usePresets', () => {
  it('starts with no saved user presets and no active preset', () => {
    const { result } = renderHook(() => usePresets())

    expect(userPresetsOf(result)).toEqual([])
    expect(result.current.activePresetId).toBeNull()
  })

  it('saves the current settings as a named preset and marks it active', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })

    expect(userPresetsOf(result)).toHaveLength(1)
    expect(userPresetsOf(result)[0]).toMatchObject({ name: 'Warm-up', config })
    expect(result.current.activePresetId).toBe(userPresetsOf(result)[0].id)
  })

  it('loads a saved preset by id and marks it active', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })
    const id = userPresetsOf(result)[0].id

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
    const id = userPresetsOf(result)[0].id

    act(() => {
      result.current.deletePreset(id)
    })

    expect(userPresetsOf(result)).toEqual([])
  })

  it('clears the active preset id when the active preset is deleted', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })
    const id = userPresetsOf(result)[0].id

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
    const warmUpId = userPresetsOf(result)[0].id
    act(() => {
      result.current.savePreset('Hard mode', { ...config, n: 4 })
    })

    act(() => {
      result.current.deletePreset(warmUpId)
    })

    expect(result.current.activePresetId).not.toBe(warmUpId)
    expect(userPresetsOf(result)).toHaveLength(1)
  })

  it('persists deletions across remounts', () => {
    const { result, unmount } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })
    const id = userPresetsOf(result)[0].id
    act(() => {
      result.current.deletePreset(id)
    })
    unmount()

    const { result: remounted } = renderHook(() => usePresets())

    expect(userPresetsOf(remounted)).toEqual([])
  })

  it('renames a preset by id', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })
    const id = userPresetsOf(result)[0].id

    act(() => {
      result.current.renamePreset(id, 'Morning warm-up')
    })

    expect(userPresetsOf(result)[0]).toMatchObject({ id, name: 'Morning warm-up' })
  })

  it('leaves the active preset id untouched when renaming the active preset', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })
    const id = userPresetsOf(result)[0].id

    act(() => {
      result.current.renamePreset(id, 'Morning warm-up')
    })

    expect(result.current.activePresetId).toBe(id)
  })

  it('persists renames across remounts', () => {
    const { result, unmount } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })
    const id = userPresetsOf(result)[0].id
    act(() => {
      result.current.renamePreset(id, 'Morning warm-up')
    })
    unmount()

    const { result: remounted } = renderHook(() => usePresets())

    expect(userPresetsOf(remounted)[0]).toMatchObject({ id, name: 'Morning warm-up' })
  })

  it('persists the saved preset list and active id across remounts', () => {
    const { result, unmount } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })
    const id = userPresetsOf(result)[0].id
    unmount()

    const { result: remounted } = renderHook(() => usePresets())

    expect(userPresetsOf(remounted)).toHaveLength(1)
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

    expect(userPresetsOf(result)).toHaveLength(1)
    expect(userPresetsOf(result)[0].config).toEqual(config)

    let loaded: ReturnType<typeof result.current.loadPreset>
    act(() => {
      loaded = result.current.loadPreset('legacy-1')
    })

    expect(loaded?.config).not.toHaveProperty('volume')
    expect(loaded?.config).not.toHaveProperty('muted')
  })
})

describe('usePresets built-in presets', () => {
  it('lists the built-in presets ahead of any user presets, in fixed order', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })

    expect(result.current.presets.slice(0, 3)).toEqual(BUILT_IN_PRESETS)
    expect(result.current.presets[3]).toMatchObject({ name: 'Warm-up' })
  })

  it('does not persist built-in presets to localStorage', () => {
    renderHook(() => usePresets())

    const raw = window.localStorage.getItem('n-back:presets')
    expect(raw ? JSON.parse(raw) : []).toEqual([])
  })

  it('loads a built-in preset by id', () => {
    const { result } = renderHook(() => usePresets())

    let loaded
    act(() => {
      loaded = result.current.loadPreset('builtin-hard')
    })

    expect(loaded).toMatchObject({ name: 'Hard' })
    expect(result.current.activePresetId).toBe('builtin-hard')
  })

  it('does not rename a built-in preset', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.renamePreset('builtin-hard', 'My Hard')
    })

    expect(result.current.presets.find((preset) => preset.id === 'builtin-hard')).toMatchObject({
      name: 'Hard',
    })
  })

  it('does not delete a built-in preset', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.deletePreset('builtin-hard')
    })

    expect(result.current.presets.find((preset) => preset.id === 'builtin-hard')).toBeDefined()
  })

  it('leaves activePresetId untouched when deletePreset is called on the active built-in preset', () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.loadPreset('builtin-hard')
    })
    act(() => {
      result.current.deletePreset('builtin-hard')
    })

    expect(result.current.activePresetId).toBe('builtin-hard')
  })
})

describe('usePresets sync', () => {
  it('does not call Supabase when unauthenticated', async () => {
    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })

    expect(mockFetchRemotePresets).not.toHaveBeenCalled()
    expect(mockPushPreset).not.toHaveBeenCalled()
  })

  it('pulls remote presets and adopts them locally when the remote list is non-empty', async () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', userId: 'user-1' })
    const remotePreset = {
      id: 'remote-1',
      name: 'From cloud',
      config,
      updatedAt: '2026-07-08T12:00:00.000Z',
      deletedAt: null,
    }
    mockFetchRemotePresets.mockResolvedValue([remotePreset])

    const { result } = renderHook(() => usePresets())

    const expected = { id: 'remote-1', name: 'From cloud', config, updatedAt: '2026-07-08T12:00:00.000Z' }
    await waitFor(() => expect(userPresetsOf(result)).toEqual([expected]))
    expect(mockFetchRemotePresets).toHaveBeenCalledWith('user-1')
    expect(JSON.parse(window.localStorage.getItem('n-back:presets') ?? '[]')).toEqual([expected])
    expect(mockPushPreset).not.toHaveBeenCalled()
  })

  it('seeds the cloud with existing local presets on first login with an empty remote account', async () => {
    window.localStorage.setItem(
      'n-back:presets',
      JSON.stringify([{ id: 'local-1', name: 'Local only', config }]),
    )
    mockUseAuth.mockReturnValue({ status: 'authenticated', userId: 'user-1' })
    mockFetchRemotePresets.mockResolvedValue([])

    const { result } = renderHook(() => usePresets())

    await waitFor(() => expect(mockPushPreset).toHaveBeenCalled())
    expect(mockPushPreset).toHaveBeenCalledWith('user-1', { id: 'local-1', name: 'Local only', config })
    expect(userPresetsOf(result)).toEqual([{ id: 'local-1', name: 'Local only', config }])
  })

  it('pushes only the changed preset to Supabase after a mutation while authenticated', async () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', userId: 'user-1' })
    mockFetchRemotePresets.mockResolvedValue([])

    const { result } = renderHook(() => usePresets())
    await waitFor(() => expect(mockFetchRemotePresets).toHaveBeenCalledTimes(1))

    act(() => {
      result.current.savePreset('Warm-up', config)
    })

    await waitFor(() => expect(mockPushPreset).toHaveBeenCalledTimes(1))
    expect(mockPushPreset).toHaveBeenCalledWith('user-1', userPresetsOf(result)[0])
  })

  it('pushes a tombstone instead of hard-deleting when deleting while authenticated', async () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', userId: 'user-1' })
    mockFetchRemotePresets.mockResolvedValue([])

    const { result } = renderHook(() => usePresets())
    await waitFor(() => expect(mockFetchRemotePresets).toHaveBeenCalledTimes(1))

    act(() => {
      result.current.savePreset('Warm-up', config)
    })
    const id = userPresetsOf(result)[0].id
    mockPushPreset.mockClear()

    act(() => {
      result.current.deletePreset(id)
    })

    expect(mockPushTombstone).toHaveBeenCalledWith('user-1', id, expect.any(String))
    expect(userPresetsOf(result)).toEqual([])
  })

  it('keeps a local mutation that races ahead of a slow initial pull', async () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', userId: 'user-1' })
    let resolvePull: (remote: unknown) => void = () => {}
    mockFetchRemotePresets.mockReturnValue(new Promise((resolve) => (resolvePull = resolve)))

    const { result } = renderHook(() => usePresets())

    act(() => {
      result.current.savePreset('Warm-up', config)
    })
    expect(userPresetsOf(result)).toHaveLength(1)

    await act(async () => {
      resolvePull([])
      await Promise.resolve()
    })

    expect(userPresetsOf(result)).toHaveLength(1)
    expect(userPresetsOf(result)[0]).toMatchObject({ name: 'Warm-up' })
  })

  it('never includes built-in presets in what gets pushed or pulled', async () => {
    window.localStorage.setItem(
      'n-back:presets',
      JSON.stringify([{ id: 'local-1', name: 'Local only', config }]),
    )
    mockUseAuth.mockReturnValue({ status: 'authenticated', userId: 'user-1' })
    mockFetchRemotePresets.mockResolvedValue([])

    const { result } = renderHook(() => usePresets())
    await waitFor(() => expect(mockPushPreset).toHaveBeenCalled())

    const pushedIds = mockPushPreset.mock.calls.map((call) => (call[1] as { id: string }).id)
    expect(pushedIds.some((id: string) => BUILT_IN_PRESETS.some((preset) => preset.id === id))).toBe(false)
    expect(result.current.presets.slice(0, BUILT_IN_COUNT)).toEqual(BUILT_IN_PRESETS)
  })

  it('resolves an edit conflict to whichever session has the later updatedAt', async () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', userId: 'user-1' })
    const local = { id: 'preset-1', name: 'Local edit', config, updatedAt: '2026-07-09T12:00:00.000Z' }
    window.localStorage.setItem('n-back:presets', JSON.stringify([local]))
    mockFetchRemotePresets.mockResolvedValue([
      {
        id: 'preset-1',
        name: 'Remote edit (older)',
        config,
        updatedAt: '2026-07-08T12:00:00.000Z',
        deletedAt: null,
      },
    ])

    const { result } = renderHook(() => usePresets())

    await waitFor(() => expect(mockPushPreset).toHaveBeenCalled())
    expect(userPresetsOf(result)).toEqual([local])
    expect(mockPushPreset).toHaveBeenCalledWith('user-1', local)
  })

  it('removes a locally-held preset once the remote copy is tombstoned', async () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', userId: 'user-1' })
    const local = { id: 'preset-1', name: 'Local copy', config, updatedAt: '2026-07-09T12:00:00.000Z' }
    window.localStorage.setItem('n-back:presets', JSON.stringify([local]))
    mockFetchRemotePresets.mockResolvedValue([
      {
        id: 'preset-1',
        name: 'Local copy',
        config,
        updatedAt: '2026-07-08T12:00:00.000Z',
        deletedAt: '2026-07-10T12:00:00.000Z',
      },
    ])

    const { result } = renderHook(() => usePresets())

    await waitFor(() => expect(userPresetsOf(result)).toEqual([]))
    expect(JSON.parse(window.localStorage.getItem('n-back:presets') ?? '[]')).toEqual([])
    expect(mockPushPreset).not.toHaveBeenCalled()
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
