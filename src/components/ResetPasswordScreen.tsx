import { useState } from 'react'
import { TEXT_INPUT_CLASS } from '../styles/controls'
import { Button } from './Button'
import { Panel } from './Panel'
import { ScreenHeader } from './ScreenHeader'

export interface ResetPasswordScreenProps {
  onSubmit: (newPassword: string) => Promise<boolean>
  onDone: () => void
  error: string | null
}

export function ResetPasswordScreen({ onSubmit, onDone, error }: ResetPasswordScreenProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mismatch, setMismatch] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    setSubmitting(true)
    const success = await onSubmit(password)
    setSubmitting(false)
    if (success) onDone()
  }

  return (
    <section className="mx-auto flex max-w-sm flex-col gap-6 py-12">
      <ScreenHeader eyebrow="Account" title="Set a new password" />
      <Panel>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            New password
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={TEXT_INPUT_CLASS}
              minLength={6}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Confirm password
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={TEXT_INPUT_CLASS}
              minLength={6}
              required
            />
          </label>
          {mismatch && <p className="text-sm text-danger">Passwords do not match.</p>}
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Updating…' : 'Set new password'}
          </Button>
        </form>
      </Panel>
    </section>
  )
}
