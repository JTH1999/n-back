import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UseAuthResult } from '../hooks/useAuth'
import { useAuth } from '../hooks/useAuth'
import { AuthPanel } from './AuthPanel'

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }))

const mockUseAuth = vi.mocked(useAuth)

const preset = { id: 'p1', name: 'X', config: {} as never }

function authResult(overrides: Partial<UseAuthResult> = {}): UseAuthResult {
  return {
    status: 'unauthenticated',
    email: null,
    userId: null,
    error: null,
    isPasswordRecovery: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn().mockResolvedValue(true),
    updatePassword: vi.fn().mockResolvedValue(true),
    clearError: vi.fn(),
    ...overrides,
  }
}

beforeEach(async () => {
  mockUseAuth.mockReset()
  window.localStorage.clear()
  const { presetPushQueue } = await import('../persistence/presetSync')
  presetPushQueue.clear()
})

describe('AuthPanel', () => {
  it('shows a loading message while the session is being checked', () => {
    mockUseAuth.mockReturnValue(authResult({ status: 'loading' }))
    render(<AuthPanel />)

    expect(screen.getByText(/checking session/i)).toBeInTheDocument()
  })

  it('shows the login form when unauthenticated', () => {
    mockUseAuth.mockReturnValue(authResult({ status: 'unauthenticated' }))
    render(<AuthPanel />)

    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('shows the logged-in email and a logout button when authenticated', () => {
    const signOut = vi.fn()
    mockUseAuth.mockReturnValue(authResult({ status: 'authenticated', email: 'a@b.com', signOut }))
    render(<AuthPanel />)

    expect(screen.getByText('a@b.com')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /log out/i }))
    expect(signOut).toHaveBeenCalled()
  })

  it('shows a live sync status indicator that reflects pending/failed queue state', async () => {
    const { presetPushQueue } = await import('../persistence/presetSync')
    mockUseAuth.mockReturnValue(authResult({ status: 'authenticated', email: 'a@b.com' }))
    render(<AuthPanel />)

    expect(screen.getByRole('status')).toHaveTextContent('Synced')

    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    await act(async () => {
      await presetPushQueue.push({ kind: 'upsert', userId: 'user-1', preset })
    })

    expect(screen.getByRole('status')).toHaveTextContent('Pending')
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('calls signIn with the submitted credentials', () => {
    const signIn = vi.fn()
    mockUseAuth.mockReturnValue(authResult({ signIn }))
    render(<AuthPanel />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'hunter2' } })
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))

    expect(signIn).toHaveBeenCalledWith('a@b.com', 'hunter2')
  })

  it('switches to the forgot password form and sends a reset email', async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue(true)
    mockUseAuth.mockReturnValue(authResult({ resetPasswordForEmail }))
    render(<AuthPanel />)

    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }))
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(resetPasswordForEmail).toHaveBeenCalledWith('a@b.com')
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
  })

  it('returns to the login form from the forgot password form', () => {
    mockUseAuth.mockReturnValue(authResult())
    render(<AuthPanel />)

    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }))
    fireEvent.click(screen.getByRole('button', { name: /back to log in/i }))

    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('clears a stale error when switching between login and forgot password modes', () => {
    const clearError = vi.fn()
    mockUseAuth.mockReturnValue(authResult({ error: 'Invalid credentials', clearError }))
    render(<AuthPanel />)

    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }))
    expect(clearError).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /back to log in/i }))
    expect(clearError).toHaveBeenCalledTimes(2)
  })
})
