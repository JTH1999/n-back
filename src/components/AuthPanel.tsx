import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSyncStatus } from '../hooks/useSyncStatus'
import { Button } from './Button'
import { LoginForm } from './LoginForm'
import { SubHeading } from './SubHeading'
import { SyncStatusIndicator } from './SyncStatusIndicator'

export function AuthPanel() {
  const { status, email, error, signIn, signOut } = useAuth()
  const syncStatus = useSyncStatus()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (submittedEmail: string, password: string) => {
    setSubmitting(true)
    await signIn(submittedEmail, password)
    setSubmitting(false)
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <SubHeading as="legend" className="mb-1">
        Account
      </SubHeading>
      {status === 'loading' && <p className="text-sm text-dim">Checking session…</p>}
      {status === 'unauthenticated' && (
        <LoginForm onSubmit={handleSubmit} error={error} submitting={submitting} />
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
