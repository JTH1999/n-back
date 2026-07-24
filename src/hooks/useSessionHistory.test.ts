import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseAuth = vi.fn()
const mockFetchRemoteHistory = vi.fn()
const mockPushHistoryRecord = vi.fn()

vi.mock('./useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}))
vi.mock('../persistence/historySync', async () => {
  const actual = await vi.importActual<typeof import('../persistence/historySync')>('../persistence/historySync')
  return {
    mergeHistory: actual.mergeHistory,
    fetchRemoteHistory: (...args: unknown[]) => mockFetchRemoteHistory(...args),
    pushHistoryRecord: (...args: unknown[]) => mockPushHistoryRecord(...args),
  }
})

import type { SessionRunnerConfig } from './useSessionRunner'
import { useSessionHistory } from './useSessionHistory'

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

const summary = {
  totalTrials: 20,
  accuracy: 0.9,
  streams: {
    position: {
      kind: 'position' as const,
      totalTrials: 20,
      hits: 5,
      misses: 1,
      falseAlarms: 1,
      correctRejections: 13,
      accuracy: 0.9,
    },
  },
}

beforeEach(() => {
  window.localStorage.clear()
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ status: 'unauthenticated', userId: null })
  mockFetchRemoteHistory.mockResolvedValue(null)
  mockPushHistoryRecord.mockResolvedValue(undefined)
})

describe('useSessionHistory', () => {
  it('starts with no history', () => {
    const { result } = renderHook(() => useSessionHistory())

    expect(result.current.history).toEqual([])
  })

  it('records a session and assigns it a unique id', () => {
    const { result } = renderHook(() => useSessionHistory())

    act(() => {
      result.current.recordSession(config, summary)
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].id).toEqual(expect.any(String))
    expect(result.current.history[0].config).toEqual(config)
  })

  it('persists recorded sessions across remounts', () => {
    const { result, unmount } = renderHook(() => useSessionHistory())

    act(() => {
      result.current.recordSession(config, summary)
    })
    unmount()

    const { result: remounted } = renderHook(() => useSessionHistory())

    expect(remounted.current.history).toHaveLength(1)
  })

  it('refresh re-reads history from storage', () => {
    const { result } = renderHook(() => useSessionHistory())

    window.localStorage.setItem(
      'n-back:session-history',
      JSON.stringify([{ id: 'record-1', timestamp: '2026-07-08T12:00:00.000Z', config, summary }]),
    )
    act(() => {
      result.current.refresh()
    })

    expect(result.current.history).toHaveLength(1)
  })
})

describe('useSessionHistory sync', () => {
  it('does not call Supabase when unauthenticated', () => {
    const { result } = renderHook(() => useSessionHistory())

    act(() => {
      result.current.recordSession(config, summary)
    })

    expect(mockFetchRemoteHistory).not.toHaveBeenCalled()
    expect(mockPushHistoryRecord).not.toHaveBeenCalled()
  })

  it('pulls remote history and merges it in when the remote list is non-empty', async () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', userId: 'user-1' })
    const remoteRecord = { id: 'remote-1', timestamp: '2026-07-08T12:00:00.000Z', config, summary }
    mockFetchRemoteHistory.mockResolvedValue([remoteRecord])

    const { result } = renderHook(() => useSessionHistory())

    await waitFor(() => expect(result.current.history).toEqual([remoteRecord]))
    expect(mockFetchRemoteHistory).toHaveBeenCalledWith('user-1')
    expect(JSON.parse(window.localStorage.getItem('n-back:session-history') ?? '[]')).toEqual([remoteRecord])
    expect(mockPushHistoryRecord).not.toHaveBeenCalled()
  })

  it('seeds the cloud with existing local history on first login with an empty remote account', async () => {
    const localRecord = { id: 'local-1', timestamp: '2026-07-08T12:00:00.000Z', config, summary }
    window.localStorage.setItem('n-back:session-history', JSON.stringify([localRecord]))
    mockUseAuth.mockReturnValue({ status: 'authenticated', userId: 'user-1' })
    mockFetchRemoteHistory.mockResolvedValue([])

    const { result } = renderHook(() => useSessionHistory())

    await waitFor(() => expect(mockPushHistoryRecord).toHaveBeenCalled())
    expect(mockPushHistoryRecord).toHaveBeenCalledWith('user-1', localRecord)
    expect(result.current.history).toEqual([localRecord])
  })

  it('pushes a newly recorded session to Supabase while authenticated', async () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', userId: 'user-1' })
    mockFetchRemoteHistory.mockResolvedValue([])

    const { result } = renderHook(() => useSessionHistory())
    await waitFor(() => expect(mockFetchRemoteHistory).toHaveBeenCalledTimes(1))

    act(() => {
      result.current.recordSession(config, summary)
    })

    await waitFor(() => expect(mockPushHistoryRecord).toHaveBeenCalledTimes(1))
    expect(mockPushHistoryRecord).toHaveBeenCalledWith('user-1', result.current.history[0])
  })

  it('does not duplicate a record that exists on both sides after a pull', async () => {
    const shared = { id: 'record-1', timestamp: '2026-07-08T12:00:00.000Z', config, summary }
    window.localStorage.setItem('n-back:session-history', JSON.stringify([shared]))
    mockUseAuth.mockReturnValue({ status: 'authenticated', userId: 'user-1' })
    mockFetchRemoteHistory.mockResolvedValue([shared])

    const { result } = renderHook(() => useSessionHistory())

    await waitFor(() => expect(mockFetchRemoteHistory).toHaveBeenCalled())
    expect(result.current.history).toEqual([shared])
    expect(mockPushHistoryRecord).not.toHaveBeenCalled()
  })
})
