import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  it('submits the entered email and password', () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} error={null} />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'hunter2' } })
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))

    expect(onSubmit).toHaveBeenCalledWith('a@b.com', 'hunter2')
  })

  it('shows a passed-in error message', () => {
    render(<LoginForm onSubmit={vi.fn()} error="Invalid credentials" />)

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('disables the submit button while submitting', () => {
    render(<LoginForm onSubmit={vi.fn()} error={null} submitting />)

    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled()
  })

  it('renders a disabled forgot password stub', () => {
    render(<LoginForm onSubmit={vi.fn()} error={null} />)

    expect(screen.getByRole('button', { name: /forgot password/i })).toBeDisabled()
  })
})
