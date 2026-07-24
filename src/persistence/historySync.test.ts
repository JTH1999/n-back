import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionHistoryRecord } from './historyStorage'

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockUpsert = vi.fn()
const mockFrom = vi.fn()

vi.mock('../auth/supabaseClient', () => ({
  get supabase() {
    return mockSupabase
  },
}))

let mockSupabase: { from: typeof mockFrom } | null = { from: mockFrom }

import { fetchRemoteHistory, mergeHistory, pushHistoryRecord } from './historySync'

const config: SessionHistoryRecord['config'] = {
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

const summary: SessionHistoryRecord['summary'] = {
  totalTrials: 20,
  accuracy: 0.9,
  streams: {
    position: {
      kind: 'position',
      totalTrials: 20,
      hits: 5,
      misses: 1,
      falseAlarms: 1,
      correctRejections: 13,
      accuracy: 0.9,
    },
  },
}

function resetMocks() {
  mockSupabase = { from: mockFrom }
  mockFrom.mockReset()
  mockSelect.mockReset()
  mockEq.mockReset()
  mockUpsert.mockReset()
}

beforeEach(() => {
  resetMocks()
})

describe('fetchRemoteHistory', () => {
  it('returns null when supabase is not configured', async () => {
    mockSupabase = null
    expect(await fetchRemoteHistory('user-1')).toBeNull()
  })

  it('maps remote rows to records', async () => {
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({
      data: [{ id: 'record-1', timestamp: '2026-07-08T12:00:00.000Z', config, summary }],
      error: null,
    })

    const result = await fetchRemoteHistory('user-1')

    expect(mockFrom).toHaveBeenCalledWith('session_history')
    expect(mockSelect).toHaveBeenCalledWith('id, timestamp, config, summary')
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result).toEqual([{ id: 'record-1', timestamp: '2026-07-08T12:00:00.000Z', config, summary }])
  })

  it('returns null when the query errors', async () => {
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: null, error: { message: 'boom' } })

    expect(await fetchRemoteHistory('user-1')).toBeNull()
  })
})

describe('pushHistoryRecord', () => {
  it('is a no-op when supabase is not configured', async () => {
    mockSupabase = null
    await pushHistoryRecord('user-1', { id: 'record-1', timestamp: '2026-07-08T12:00:00.000Z', config, summary })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('upserts the record', async () => {
    mockFrom.mockReturnValue({ upsert: mockUpsert })
    mockUpsert.mockResolvedValue({ error: null })
    const record: SessionHistoryRecord = { id: 'record-1', timestamp: '2026-07-08T12:00:00.000Z', config, summary }

    await pushHistoryRecord('user-1', record)

    expect(mockFrom).toHaveBeenCalledWith('session_history')
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        id: 'record-1',
        user_id: 'user-1',
        timestamp: '2026-07-08T12:00:00.000Z',
        config,
        summary,
      },
      { onConflict: 'id' },
    )
  })

  it('swallows errors from the underlying Supabase call', async () => {
    mockFrom.mockReturnValue({ upsert: mockUpsert })
    mockUpsert.mockRejectedValue(new Error('network down'))

    await expect(
      pushHistoryRecord('user-1', { id: 'record-1', timestamp: '2026-07-08T12:00:00.000Z', config, summary }),
    ).resolves.toBeUndefined()
  })
})

describe('mergeHistory', () => {
  function record(overrides: Partial<SessionHistoryRecord> = {}): SessionHistoryRecord {
    return { id: 'record-1', timestamp: '2026-07-08T12:00:00.000Z', config, summary, ...overrides }
  }

  it('keeps a local-only record and queues it for push', () => {
    const local = record()

    const { merged, toPush } = mergeHistory([local], [])

    expect(merged).toEqual([local])
    expect(toPush).toEqual([local])
  })

  it('adopts a remote-only record the local device has not seen yet', () => {
    const remote = record({ id: 'record-2' })

    const { merged, toPush } = mergeHistory([], [remote])

    expect(merged).toEqual([remote])
    expect(toPush).toEqual([])
  })

  it('de-dupes a record both sides already have without queuing it for push', () => {
    const shared = record()

    const { merged, toPush } = mergeHistory([shared], [shared])

    expect(merged).toEqual([shared])
    expect(toPush).toEqual([])
  })

  it('sorts the merged list by timestamp', () => {
    const earlier = record({ id: 'record-1', timestamp: '2026-07-01T12:00:00.000Z' })
    const later = record({ id: 'record-2', timestamp: '2026-07-05T12:00:00.000Z' })

    const { merged } = mergeHistory([later], [earlier])

    expect(merged).toEqual([earlier, later])
  })
})
