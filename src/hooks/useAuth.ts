import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../auth/supabaseClient'
import { historyPushQueue } from '../persistence/historySync'
import { presetPushQueue } from '../persistence/presetSync'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

// Queued pushes carry the userId active when they were enqueued — dropping
// them on logout avoids a stale push later landing (or failing an RLS check)
// under a different account signed in on the same device.
function clearPendingSync() {
  presetPushQueue.clear()
  historyPushQueue.clear()
}

export interface UseAuthResult {
  status: AuthStatus
  email: string | null
  userId: string | null
  error: string | null
  isPasswordRecovery: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPasswordForEmail: (email: string) => Promise<boolean>
  updatePassword: (newPassword: string) => Promise<boolean>
  clearError: () => void
}

export function useAuth(): UseAuthResult {
  const [status, setStatus] = useState<AuthStatus>(supabase ? 'loading' : 'unauthenticated')
  const [email, setEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) clearPendingSync()
      setEmail(data.session?.user.email ?? null)
      setUserId(data.session?.user.id ?? null)
      setStatus(data.session ? 'authenticated' : 'unauthenticated')
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) clearPendingSync()
      setEmail(session?.user.email ?? null)
      setUserId(session?.user.id ?? null)
      setStatus(session ? 'authenticated' : 'unauthenticated')
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true)
      if (event === 'SIGNED_OUT') setIsPasswordRecovery(false)
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

  const resetPasswordForEmail = useCallback(async (submittedEmail: string) => {
    if (!supabase) {
      setError('Auth is not configured for this build.')
      return false
    }
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(submittedEmail, {
      redirectTo: window.location.origin,
    })
    if (error) {
      setError(error.message)
      return false
    }
    return true
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabase) {
      setError('Auth is not configured for this build.')
      return false
    }
    setError(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setError(error.message)
      return false
    }
    return true
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return {
    status,
    email,
    userId,
    error,
    isPasswordRecovery,
    signIn,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    clearError,
  }
}
