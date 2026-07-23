import { useState } from 'react'
import { TEXT_INPUT_CLASS } from '../styles/controls'
import { Button } from './Button'

export interface LoginFormProps {
  onSubmit: (email: string, password: string) => void
  error: string | null
  submitting?: boolean
}

export function LoginForm({ onSubmit, error, submitting = false }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(email, password)
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
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={TEXT_INPUT_CLASS}
          required
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Logging in…' : 'Log in'}
      </Button>
      <button
        type="button"
        disabled
        className="text-center text-[13px] text-dim underline decoration-dotted disabled:cursor-not-allowed"
      >
        Forgot password?
      </button>
    </form>
  )
}
