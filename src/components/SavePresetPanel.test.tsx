import { fireEvent, render, screen } from '@testing-library/react'
import type { FormEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SavePresetPanel } from './SavePresetPanel'

describe('SavePresetPanel', () => {
  it('shows the current config summary', () => {
    render(<SavePresetPanel currentSummary="N2 · position · 20t" onSave={vi.fn()} />)

    expect(screen.getByText('N2 · position · 20t')).toBeInTheDocument()
  })

  it('disables save until a name is entered', () => {
    render(<SavePresetPanel currentSummary="N2 · position · 20t" onSave={vi.fn()} />)

    expect(screen.getByRole('button', { name: /save preset/i })).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText(/preset name/i), { target: { value: 'Warm-up' } })

    expect(screen.getByRole('button', { name: /save preset/i })).not.toBeDisabled()
  })

  it('saves a preset with the entered name and clears the field', () => {
    const onSave = vi.fn()
    render(<SavePresetPanel currentSummary="N2 · position · 20t" onSave={onSave} />)

    fireEvent.change(screen.getByPlaceholderText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    expect(onSave).toHaveBeenCalledWith('Warm-up')
    expect(screen.getByPlaceholderText(/preset name/i)).toHaveValue('')
  })

  it('does not save a blank or whitespace-only name', () => {
    const onSave = vi.fn()
    render(<SavePresetPanel currentSummary="N2 · position · 20t" onSave={onSave} />)

    fireEvent.change(screen.getByPlaceholderText(/preset name/i), { target: { value: '   ' } })

    expect(screen.getByRole('button', { name: /save preset/i })).toBeDisabled()
  })

  it('saves on Enter without submitting an enclosing form', () => {
    const onSave = vi.fn()
    const onFormSubmit = vi.fn((event: FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onFormSubmit}>
        <SavePresetPanel currentSummary="N2 · position · 20t" onSave={onSave} />
      </form>,
    )

    fireEvent.change(screen.getByPlaceholderText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.keyDown(screen.getByPlaceholderText(/preset name/i), { key: 'Enter' })

    expect(onSave).toHaveBeenCalledWith('Warm-up')
    expect(onFormSubmit).not.toHaveBeenCalled()
  })
})
