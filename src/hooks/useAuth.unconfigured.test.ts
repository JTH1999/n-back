import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../auth/supabaseClient', () => ({ supabase: null }))

import { useAuth } from './useAuth'

describe('useAuth (no supabase client configured)', () => {
  it('stays unauthenticated and never gets stuck loading', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.status).toBe('unauthenticated')
    expect(result.current.email).toBeNull()
  })

  it('signIn reports a configuration error instead of throwing', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signIn('a@b.com', 'password')
    })

    expect(result.current.error).toBe('Auth is not configured for this build.')
  })

  it('signOut is a no-op', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signOut()
    })

    expect(result.current.status).toBe('unauthenticated')
  })
})
