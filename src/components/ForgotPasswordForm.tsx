import { useState } from 'react'
import { TEXT_INPUT_CLASS } from '../styles/controls'
import { Button } from './Button'
import { TextLinkButton } from './TextLinkButton'

export interface ForgotPasswordFormProps {
  onSubmit: (email: string) => void
  onBack: () => void
  error: string | null
  submitting?: boolean
  sent?: boolean
}

export function ForgotPasswordForm({
  onSubmit,
  onBack,
  error,
  submitting = false,
  sent = false,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(email)
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">Check your email for a link to reset your password.</p>
        <Button variant="ghost" type="button" onClick={onBack} className="w-full">
          Back to log in
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={TEXT_INPUT_CLASS}
          required
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Sending…' : 'Send reset link'}
      </Button>
      <TextLinkButton onClick={onBack}>Back to log in</TextLinkButton>
    </form>
  )
}
