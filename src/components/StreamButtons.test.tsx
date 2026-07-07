import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StreamButtons } from './StreamButtons'

describe('StreamButtons', () => {
  it('renders a labeled button for each active stream', () => {
    render(
      <StreamButtons
        activeStreams={['position', 'color']}
        pressedStreams={new Set()}
        onAssert={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /position/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /color/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /shape/i })).not.toBeInTheDocument()
  })

  it('dispatches an assert-match action for the tapped stream', () => {
    const onAssert = vi.fn()
    render(
      <StreamButtons
        activeStreams={['position', 'letter']}
        pressedStreams={new Set()}
        onAssert={onAssert}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /letter/i }))

    expect(onAssert).toHaveBeenCalledWith('letter')
    expect(onAssert).toHaveBeenCalledTimes(1)
  })

  it('shows a pressed outline only for streams marked as pressed', () => {
    render(
      <StreamButtons
        activeStreams={['position', 'letter']}
        pressedStreams={new Set(['letter'])}
        onAssert={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /letter/i }).className).toContain(
      'outline-slate-900',
    )
    expect(screen.getByRole('button', { name: /position/i }).className).toContain(
      'outline-transparent',
    )
  })
})
