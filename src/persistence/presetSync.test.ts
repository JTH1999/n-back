import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Preset } from '../hooks/usePresets'

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockEq2 = vi.fn()
const mockUpsert = vi.fn()
const mockUpdate = vi.fn()
const mockFrom = vi.fn()

vi.mock('../auth/supabaseClient', () => ({
  get supabase() {
    return mockSupabase
  },
}))

let mockSupabase: { from: typeof mockFrom } | null = { from: mockFrom }

import { fetchRemotePresets, mergePresets, pushPreset, pushTombstone, type RemotePresetRecord } from './presetSync'

const config: Preset['config'] = {
  n: 2,
  trialCount: 20,
  streams: ['position'],
  displayDurationMs: 500,
  trialLengthMs: 2500,
  liveFeedback: false,
  adaptive: { enabled: false, lowerThreshold: 0.5, upperThreshold: 0.8 },
}

function resetMocks() {
  mockSupabase = { from: mockFrom }
  mockFrom.mockReset()
  mockSelect.mockReset()
  mockEq.mockReset()
  mockEq2.mockReset()
  mockUpsert.mockReset()
  mockUpdate.mockReset()
}

beforeEach(() => {
  resetMocks()
})

describe('fetchRemotePresets', () => {
  it('returns null when supabase is not configured', async () => {
    mockSupabase = null
    expect(await fetchRemotePresets('user-1')).toBeNull()
  })

  it('maps remote rows to records, including tombstones', async () => {
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({
      data: [
        {
          id: 'preset-1',
          name: 'Warm-up',
          config,
          updated_at: '2026-07-08T12:00:00.000Z',
          deleted_at: null,
        },
        {
          id: 'preset-2',
          name: 'Old',
          config,
          updated_at: '2026-07-09T12:00:00.000Z',
          deleted_at: '2026-07-09T12:00:00.000Z',
        },
      ],
      error: null,
    })

    const result = await fetchRemotePresets('user-1')

    expect(mockFrom).toHaveBeenCalledWith('presets')
    expect(mockSelect).toHaveBeenCalledWith('id, name, config, updated_at, deleted_at')
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result).toEqual([
      { id: 'preset-1', name: 'Warm-up', config, updatedAt: '2026-07-08T12:00:00.000Z', deletedAt: null },
      { id: 'preset-2', name: 'Old', config, updatedAt: '2026-07-09T12:00:00.000Z', deletedAt: '2026-07-09T12:00:00.000Z' },
    ])
  })

  it('returns null when the query errors', async () => {
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: null, error: { message: 'boom' } })

    expect(await fetchRemotePresets('user-1')).toBeNull()
  })
})

describe('pushPreset', () => {
  it('is a no-op when supabase is not configured', async () => {
    mockSupabase = null
    await pushPreset('user-1', { id: 'preset-1', name: 'Warm-up', config })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('upserts the preset as a non-deleted row', async () => {
    mockFrom.mockReturnValue({ upsert: mockUpsert })
    mockUpsert.mockResolvedValue({ error: null })
    const preset: Preset = { id: 'preset-1', name: 'Warm-up', config, updatedAt: '2026-07-08T12:00:00.000Z' }

    await pushPreset('user-1', preset)

    expect(mockFrom).toHaveBeenCalledWith('presets')
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        id: 'preset-1',
        user_id: 'user-1',
        name: 'Warm-up',
        config,
        updated_at: '2026-07-08T12:00:00.000Z',
        deleted_at: null,
      },
      { onConflict: 'id' },
    )
  })

  it('defaults a missing updatedAt to the current time when pushing', async () => {
    mockFrom.mockReturnValue({ upsert: mockUpsert })
    mockUpsert.mockResolvedValue({ error: null })

    await pushPreset('user-1', { id: 'preset-1', name: 'Warm-up', config })

    const [[row]] = mockUpsert.mock.calls
    expect(typeof row.updated_at).toBe('string')
  })

  it('swallows errors from the underlying Supabase call', async () => {
    mockFrom.mockReturnValue({ upsert: mockUpsert })
    mockUpsert.mockRejectedValue(new Error('network down'))

    await expect(
      pushPreset('user-1', { id: 'preset-1', name: 'Warm-up', config }),
    ).resolves.toBeUndefined()
  })
})

describe('pushTombstone', () => {
  it('is a no-op when supabase is not configured', async () => {
    mockSupabase = null
    await pushTombstone('user-1', 'preset-1', '2026-07-08T12:00:00.000Z')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('sets deleted_at and updated_at for the matching row', async () => {
    mockFrom.mockReturnValue({ update: mockUpdate })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ eq: mockEq2 })
    mockEq2.mockResolvedValue({ error: null })

    await pushTombstone('user-1', 'preset-1', '2026-07-08T12:00:00.000Z')

    expect(mockFrom).toHaveBeenCalledWith('presets')
    expect(mockUpdate).toHaveBeenCalledWith({
      deleted_at: '2026-07-08T12:00:00.000Z',
      updated_at: '2026-07-08T12:00:00.000Z',
    })
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(mockEq2).toHaveBeenCalledWith('id', 'preset-1')
  })

  it('swallows errors from the underlying Supabase call', async () => {
    mockFrom.mockReturnValue({ update: mockUpdate })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ eq: mockEq2 })
    mockEq2.mockRejectedValue(new Error('network down'))

    await expect(
      pushTombstone('user-1', 'preset-1', '2026-07-08T12:00:00.000Z'),
    ).resolves.toBeUndefined()
  })
})

describe('mergePresets', () => {
  const older = '2026-07-08T12:00:00.000Z'
  const newer = '2026-07-09T12:00:00.000Z'

  function record(overrides: Partial<RemotePresetRecord> = {}): RemotePresetRecord {
    return { id: 'preset-1', name: 'Remote', config, updatedAt: older, deletedAt: null, ...overrides }
  }

  it('keeps the local edit when it is newer than the remote edit', () => {
    const local: Preset = { id: 'preset-1', name: 'Local', config, updatedAt: newer }
    const remote = [record({ updatedAt: older })]

    const { merged, toPush } = mergePresets([local], remote)

    expect(merged).toEqual([local])
    expect(toPush).toEqual([local])
  })

  it('takes the remote edit when it is newer than the local edit', () => {
    const local: Preset = { id: 'preset-1', name: 'Local', config, updatedAt: older }
    const remote = [record({ name: 'Remote wins', updatedAt: newer })]

    const { merged, toPush } = mergePresets([local], remote)

    expect(merged).toEqual([{ id: 'preset-1', name: 'Remote wins', config, updatedAt: newer }])
    expect(toPush).toEqual([])
  })

  it('drops a local preset when the remote copy is tombstoned, even if edited more recently locally', () => {
    const local: Preset = { id: 'preset-1', name: 'Local', config, updatedAt: newer }
    const remote = [record({ updatedAt: older, deletedAt: older })]

    const { merged, toPush } = mergePresets([local], remote)

    expect(merged).toEqual([])
    expect(toPush).toEqual([])
  })

  it('keeps a local-only preset that has never been synced and queues it for push', () => {
    const local: Preset = { id: 'preset-1', name: 'Local only', config, updatedAt: older }

    const { merged, toPush } = mergePresets([local], [])

    expect(merged).toEqual([local])
    expect(toPush).toEqual([local])
  })

  it('adopts a remote-only preset the local device has not seen yet', () => {
    const remote = [record({ id: 'preset-2', name: 'From another device' })]

    const { merged, toPush } = mergePresets([], remote)

    expect(merged).toEqual([{ id: 'preset-2', name: 'From another device', config, updatedAt: older }])
    expect(toPush).toEqual([])
  })

  it('ignores a remote-only tombstone the local device has not seen', () => {
    const remote = [record({ id: 'preset-2', deletedAt: older })]

    const { merged, toPush } = mergePresets([], remote)

    expect(merged).toEqual([])
    expect(toPush).toEqual([])
  })
})
