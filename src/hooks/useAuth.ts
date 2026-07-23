import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../auth/supabaseClient'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface UseAuthResult {
  status: AuthStatus
  email: string | null
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthResult {
  const [status, setStatus] = useState<AuthStatus>(supabase ? 'loading' : 'unauthenticated')
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null)
      setStatus(data.session ? 'authenticated' : 'unauthenticated')
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null)
      setStatus(session ? 'authenticated' : 'unauthenticated')
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (submittedEmail: string, password: string) => {
    if (!supabase) {
      setError('Auth is not configured for this build.')
      return
    }
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: submittedEmail, password })
    if (error) setError(error.message)
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  return { status, email, error, signIn, signOut }
}
