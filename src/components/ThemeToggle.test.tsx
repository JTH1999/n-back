import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  it('marks the current override as checked', () => {
    render(<ThemeToggle override="dark" onChange={vi.fn()} />)

    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'false')
  })

  it('marks System as checked when there is no override', () => {
    render(<ThemeToggle override={null} onChange={vi.fn()} />)

    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true')
  })

  it('reports the selected theme', () => {
    const onChange = vi.fn()
    render(<ThemeToggle override={null} onChange={onChange} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }))

    expect(onChange).toHaveBeenCalledWith('dark')
  })

  it('reports null when System is selected', () => {
    const onChange = vi.fn()
    render(<ThemeToggle override="light" onChange={onChange} />)

    fireEvent.click(screen.getByRole('radio', { name: 'System' }))

    expect(onChange).toHaveBeenCalledWith(null)
  })
})
