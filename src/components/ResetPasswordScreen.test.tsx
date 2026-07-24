import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ResetPasswordScreen } from './ResetPasswordScreen'

describe('ResetPasswordScreen', () => {
  it('submits the new password when both fields match', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true)
    const onDone = vi.fn()
    render(<ResetPasswordScreen onSubmit={onSubmit} onDone={onDone} error={null} />)

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: /set new password/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('newpass123'))
    await waitFor(() => expect(onDone).toHaveBeenCalled())
  })

  it('shows a mismatch error and does not submit when passwords differ', () => {
    const onSubmit = vi.fn()
    render(<ResetPasswordScreen onSubmit={onSubmit} onDone={vi.fn()} error={null} />)

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different' } })
    fireEvent.click(screen.getByRole('button', { name: /set new password/i }))

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not call onDone when the update fails', async () => {
    const onSubmit = vi.fn().mockResolvedValue(false)
    const onDone = vi.fn()
    render(<ResetPasswordScreen onSubmit={onSubmit} onDone={onDone} error="Password too short" />)

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: /set new password/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onDone).not.toHaveBeenCalled()
    expect(screen.getByText('Password too short')).toBeInTheDocument()
  })
})
