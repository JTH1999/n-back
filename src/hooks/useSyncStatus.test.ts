import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UseAuthResult } from './useAuth'
import { useAuth } from './useAuth'
import { useSyncStatus } from './useSyncStatus'

vi.mock('./useAuth', () => ({ useAuth: vi.fn() }))

const mockUpsert = vi.fn()
const mockFrom = vi.fn(() => ({ upsert: mockUpsert }))
vi.mock('../auth/supabaseClient', () => ({
  get supabase() {
    return { from: mockFrom }
  },
}))

const mockUseAuth = vi.mocked(useAuth)

function authResult(overrides: Partial<UseAuthResult> = {}): UseAuthResult {
  return {
    status: 'authenticated',
    email: 'a@b.com',
    userId: 'user-1',
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  }
}

const preset = { id: 'p1', name: 'X', config: {} as never }
const record = { id: 'r1', timestamp: '2026-07-08T12:00:00.000Z', config: {} as never, summary: {} as never }

beforeEach(async () => {
  mockUseAuth.mockReset()
  mockFrom.mockClear()
  mockUpsert.mockReset()
  window.localStorage.clear()
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  const { presetPushQueue } = await import('../persistence/presetSync')
  const { historyPushQueue } = await import('../persistence/historySync')
  presetPushQueue.clear()
  historyPushQueue.clear()
})

describe('useSyncStatus', () => {
  it('returns null when not authenticated, regardless of queue state', () => {
    mockUseAuth.mockReturnValue(authResult({ status: 'unauthenticated' }))
    const { result } = renderHook(() => useSyncStatus())

    expect(result.current).toBeNull()
  })

  it('returns synced when authenticated with nothing queued', () => {
    mockUseAuth.mockReturnValue(authResult())
    const { result } = renderHook(() => useSyncStatus())

    expect(result.current).toBe('synced')
  })

  it('returns pending while a push is queued but has not failed yet', async () => {
    const { presetPushQueue } = await import('../persistence/presetSync')
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })

    await presetPushQueue.push({ kind: 'upsert', userId: 'user-1', preset })

    mockUseAuth.mockReturnValue(authResult())
    const { result } = renderHook(() => useSyncStatus())

    expect(result.current).toBe('pending')
  })

  it('returns failed-retrying once a push has failed at least once', async () => {
    const { historyPushQueue } = await import('../persistence/historySync')
    mockUpsert.mockRejectedValue(new Error('network down'))

    await historyPushQueue.push({ userId: 'user-1', record })

    mockUseAuth.mockReturnValue(authResult())
    const { result } = renderHook(() => useSyncStatus())

    expect(result.current).toBe('failed-retrying')
  })
})
