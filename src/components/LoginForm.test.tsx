import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  it('submits the entered email and password', () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} onForgotPassword={vi.fn()} error={null} />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'hunter2' } })
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))

    expect(onSubmit).toHaveBeenCalledWith('a@b.com', 'hunter2')
  })

  it('shows a passed-in error message', () => {
    render(<LoginForm onSubmit={vi.fn()} onForgotPassword={vi.fn()} error="Invalid credentials" />)

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('disables the submit button while submitting', () => {
    render(<LoginForm onSubmit={vi.fn()} onForgotPassword={vi.fn()} error={null} submitting />)

    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled()
  })

  it('triggers the forgot password callback when clicked', () => {
    const onForgotPassword = vi.fn()
    render(<LoginForm onSubmit={vi.fn()} onForgotPassword={onForgotPassword} error={null} />)

    const forgotPasswordButton = screen.getByRole('button', { name: /forgot password/i })
    expect(forgotPasswordButton).toBeEnabled()
    fireEvent.click(forgotPasswordButton)

    expect(onForgotPassword).toHaveBeenCalled()
  })
})
