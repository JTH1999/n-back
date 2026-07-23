import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Preset } from '../hooks/usePresets'

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockUpsert = vi.fn()
const mockDelete = vi.fn()
const mockIn = vi.fn()
const mockFrom = vi.fn()

vi.mock('../auth/supabaseClient', () => ({
  get supabase() {
    return mockSupabase
  },
}))

let mockSupabase: { from: typeof mockFrom } | null = { from: mockFrom }

import { fetchRemotePresets, replaceRemotePresets } from './presetSync'

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
  mockUpsert.mockReset()
  mockDelete.mockReset()
  mockIn.mockReset()
}

beforeEach(() => {
  resetMocks()
})

describe('fetchRemotePresets', () => {
  it('returns null when supabase is not configured', async () => {
    mockSupabase = null
    expect(await fetchRemotePresets('user-1')).toBeNull()
  })

  it('maps remote rows to Preset objects', async () => {
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({
      data: [
        { id: 'preset-1', name: 'Warm-up', config, updated_at: '2026-07-08T12:00:00.000Z' },
      ],
      error: null,
    })

    const result = await fetchRemotePresets('user-1')

    expect(mockFrom).toHaveBeenCalledWith('presets')
    expect(mockSelect).toHaveBeenCalledWith('id, name, config, updated_at')
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result).toEqual([
      { id: 'preset-1', name: 'Warm-up', config, updatedAt: '2026-07-08T12:00:00.000Z' },
    ])
  })

  it('returns null when the query errors', async () => {
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: null, error: { message: 'boom' } })

    expect(await fetchRemotePresets('user-1')).toBeNull()
  })
})

describe('replaceRemotePresets', () => {
  it('is a no-op when supabase is not configured', async () => {
    mockSupabase = null
    await replaceRemotePresets('user-1', [])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('deletes stale remote rows not present locally and upserts the current list', async () => {
    const preset: Preset = { id: 'preset-1', name: 'Warm-up', config, updatedAt: '2026-07-08T12:00:00.000Z' }
    mockFrom.mockReturnValue({ select: mockSelect, delete: mockDelete, upsert: mockUpsert })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: [{ id: 'preset-1' }, { id: 'stale-preset' }], error: null })
    mockDelete.mockReturnValue({ eq: () => ({ in: mockIn }) })
    mockIn.mockResolvedValue({ error: null })
    mockUpsert.mockResolvedValue({ error: null })

    await replaceRemotePresets('user-1', [preset])

    expect(mockIn).toHaveBeenCalledWith('id', ['stale-preset'])
    expect(mockUpsert).toHaveBeenCalledWith(
      [{ id: 'preset-1', user_id: 'user-1', name: 'Warm-up', config, updated_at: '2026-07-08T12:00:00.000Z' }],
      { onConflict: 'id' },
    )
  })

  it('deletes all remote rows for the user when the local list is empty', async () => {
    mockFrom.mockReturnValue({ select: mockSelect, delete: mockDelete, upsert: mockUpsert })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: [{ id: 'stale-preset' }], error: null })
    mockDelete.mockReturnValue({ eq: () => ({ in: mockIn }) })
    mockIn.mockResolvedValue({ error: null })

    await replaceRemotePresets('user-1', [])

    expect(mockIn).toHaveBeenCalledWith('id', ['stale-preset'])
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('defaults a missing updatedAt to the current time when pushing', async () => {
    const preset: Preset = { id: 'preset-1', name: 'Warm-up', config }
    mockFrom.mockReturnValue({ select: mockSelect, delete: mockDelete, upsert: mockUpsert })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: [], error: null })
    mockUpsert.mockResolvedValue({ error: null })

    await replaceRemotePresets('user-1', [preset])

    const [[rows]] = mockUpsert.mock.calls
    expect(typeof rows[0].updated_at).toBe('string')
  })

  it('swallows errors from the underlying Supabase calls', async () => {
    mockFrom.mockReturnValue({ select: mockSelect, delete: mockDelete, upsert: mockUpsert })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockRejectedValue(new Error('network down'))

    await expect(replaceRemotePresets('user-1', [])).resolves.toBeUndefined()
  })
})
