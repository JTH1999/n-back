import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()

vi.mock('../auth/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  },
}))

import { historyPushQueue } from '../persistence/historySync'
import { presetPushQueue } from '../persistence/presetSync'
import { useAuth } from './useAuth'

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.clear()
  mockGetSession.mockResolvedValue({ data: { session: null } })
  mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  presetPushQueue.clear()
  historyPushQueue.clear()
})

describe('useAuth', () => {
  it('starts loading then resolves to unauthenticated when there is no session', async () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))
    expect(result.current.email).toBeNull()
  })

  it('resolves to authenticated when a session already exists', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { email: 'a@b.com', id: 'user-1' } } },
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.status).toBe('authenticated'))
    expect(result.current.email).toBe('a@b.com')
    expect(result.current.userId).toBe('user-1')
  })

  it('signIn calls supabase and surfaces errors', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } })
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))

    await act(async () => {
      await result.current.signIn('a@b.com', 'wrong')
    })

    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'wrong' })
    expect(result.current.error).toBe('Invalid credentials')
  })

  it('signIn clears a previous error on a fresh attempt', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid credentials' } })
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))
    await act(async () => {
      await result.current.signIn('a@b.com', 'wrong')
    })
    expect(result.current.error).toBe('Invalid credentials')

    mockSignInWithPassword.mockResolvedValueOnce({ error: null })
    await act(async () => {
      await result.current.signIn('a@b.com', 'right')
    })
    expect(result.current.error).toBeNull()
  })

  it('signOut calls supabase.auth.signOut', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('clears queued sync pushes when the session goes away, so they cannot land under a different account', async () => {
    let authCallback: (event: string, session: unknown) => void = () => {}
    mockOnAuthStateChange.mockImplementation((callback) => {
      authCallback = callback
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    await presetPushQueue.push({ kind: 'upsert', userId: 'user-1', preset: { id: 'p1', name: 'X', config: {} as never } })
    expect(presetPushQueue.getStatus()).not.toBe('idle')

    renderHook(() => useAuth())
    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled())

    act(() => {
      authCallback('SIGNED_OUT', null)
    })

    expect(presetPushQueue.getStatus()).toBe('idle')
  })

  it('reacts to onAuthStateChange callbacks', async () => {
    let authCallback: (event: string, session: unknown) => void = () => {}
    mockOnAuthStateChange.mockImplementation((callback) => {
      authCallback = callback
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))

    act(() => {
      authCallback('SIGNED_IN', { user: { email: 'c@d.com', id: 'user-2' } })
    })

    expect(result.current.status).toBe('authenticated')
    expect(result.current.email).toBe('c@d.com')
    expect(result.current.userId).toBe('user-2')

    act(() => {
      authCallback('SIGNED_OUT', null)
    })

    expect(result.current.status).toBe('unauthenticated')
    expect(result.current.email).toBeNull()
    expect(result.current.userId).toBeNull()
  })
})
