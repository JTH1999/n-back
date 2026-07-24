import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSyncStatus } from '../hooks/useSyncStatus'
import { Button } from './Button'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { LoginForm } from './LoginForm'
import { SubHeading } from './SubHeading'
import { SyncStatusIndicator } from './SyncStatusIndicator'

type AuthMode = 'login' | 'forgot-password'

export function AuthPanel() {
  const { status, email, error, signIn, signOut, resetPasswordForEmail, clearError } = useAuth()
  const syncStatus = useSyncStatus()
  const [submitting, setSubmitting] = useState(false)
  const [mode, setMode] = useState<AuthMode>('login')
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const handleSubmit = async (submittedEmail: string, password: string) => {
    setSubmitting(true)
    await signIn(submittedEmail, password)
    setSubmitting(false)
  }

  const handleForgotPassword = async (submittedEmail: string) => {
    setSubmitting(true)
    const success = await resetPasswordForEmail(submittedEmail)
    setSubmitting(false)
    if (success) setResetEmailSent(true)
  }

  const handleShowForgotPassword = () => {
    clearError()
    setMode('forgot-password')
  }

  const handleBackToLogin = () => {
    clearError()
    setMode('login')
    setResetEmailSent(false)
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <SubHeading as="legend" className="mb-1">
        Account
      </SubHeading>
      {status === 'loading' && <p className="text-sm text-dim">Checking session…</p>}
      {status === 'unauthenticated' && mode === 'login' && (
        <LoginForm
          onSubmit={handleSubmit}
          onForgotPassword={handleShowForgotPassword}
          error={error}
          submitting={submitting}
        />
      )}
      {status === 'unauthenticated' && mode === 'forgot-password' && (
        <ForgotPasswordForm
          onSubmit={handleForgotPassword}
          onBack={handleBackToLogin}
          error={error}
          submitting={submitting}
          sent={resetEmailSent}
        />
      )}
      {status === 'authenticated' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            Logged in as <span className="font-medium">{email}</span>
          </p>
          {syncStatus && <SyncStatusIndicator status={syncStatus} />}
          <Button variant="ghost" onClick={() => signOut()} className="w-full">
            Log out
          </Button>
        </div>
      )}
    </fieldset>
  )
}
