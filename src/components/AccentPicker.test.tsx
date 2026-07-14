import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AccentPicker } from './AccentPicker'

describe('AccentPicker', () => {
  it('marks the current accent as checked', () => {
    render(<AccentPicker accent="rose" onChange={vi.fn()} />)

    expect(screen.getByRole('radio', { name: 'Rose' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Teal' })).toHaveAttribute('aria-checked', 'false')
  })

  it('reports the selected accent', () => {
    const onChange = vi.fn()
    render(<AccentPicker accent="teal" onChange={onChange} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Amber' }))

    expect(onChange).toHaveBeenCalledWith('amber')
  })
})
