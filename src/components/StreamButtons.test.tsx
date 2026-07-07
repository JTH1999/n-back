import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StreamButtons } from './StreamButtons'

describe('StreamButtons', () => {
  it('renders a labeled button for each active stream', () => {
    render(<StreamButtons activeStreams={['position', 'color']} onAssert={vi.fn()} />)

    expect(screen.getByRole('button', { name: /position/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /color/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /shape/i })).not.toBeInTheDocument()
  })

  it('dispatches an assert-match action for the tapped stream', () => {
    const onAssert = vi.fn()
    render(<StreamButtons activeStreams={['position', 'letter']} onAssert={onAssert} />)

    fireEvent.click(screen.getByRole('button', { name: /letter/i }))

    expect(onAssert).toHaveBeenCalledWith('letter')
    expect(onAssert).toHaveBeenCalledTimes(1)
  })
})
