import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Grid } from './Grid'

describe('Grid', () => {
  it('renders the shape in blue when the Color stream is inactive', () => {
    render(<Grid stimulus={{ cell: 0, shape: 'circle', color: null }} />)

    const cell = screen.getByTestId('grid-cell-0')
    expect(cell.querySelector('div > div')).toHaveClass('bg-palette-blue')
  })

  it('renders the shape in the active color when the Color stream is active', () => {
    render(<Grid stimulus={{ cell: 0, shape: 'circle', color: 'orange' }} />)

    const cell = screen.getByTestId('grid-cell-0')
    expect(cell.querySelector('div > div')).toHaveClass('bg-palette-orange')
  })

  it('renders the neutral marker in blue when Shape and Color are both inactive', () => {
    render(<Grid stimulus={{ cell: 0, shape: null, color: null }} />)

    const cell = screen.getByTestId('grid-cell-0')
    expect(cell.querySelector('div > div')).toHaveClass('bg-palette-blue')
  })
})
