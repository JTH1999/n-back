import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ForgotPasswordForm } from './ForgotPasswordForm'

describe('ForgotPasswordForm', () => {
  it('submits the entered email', () => {
    const onSubmit = vi.fn()
    render(<ForgotPasswordForm onSubmit={onSubmit} onBack={vi.fn()} error={null} />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(onSubmit).toHaveBeenCalledWith('a@b.com')
  })

  it('shows a passed-in error message', () => {
    render(<ForgotPasswordForm onSubmit={vi.fn()} onBack={vi.fn()} error="Unknown email" />)

    expect(screen.getByText('Unknown email')).toBeInTheDocument()
  })

  it('disables the submit button while submitting', () => {
    render(<ForgotPasswordForm onSubmit={vi.fn()} onBack={vi.fn()} error={null} submitting />)

    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()
  })

  it('shows a confirmation message and hides the form once sent', () => {
    render(<ForgotPasswordForm onSubmit={vi.fn()} onBack={vi.fn()} error={null} sent />)

    expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
  })

  it('calls onBack when "back to log in" is clicked', () => {
    const onBack = vi.fn()
    render(<ForgotPasswordForm onSubmit={vi.fn()} onBack={onBack} error={null} />)

    fireEvent.click(screen.getByRole('button', { name: /back to log in/i }))

    expect(onBack).toHaveBeenCalled()
  })
})
