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

  it('shows a plain outline when no feedback is provided', () => {
    render(
      <StreamButtons
        activeStreams={['position']}
        pressedStreams={new Set()}
        onAssert={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /position/i }).className).toContain(
      'outline-transparent',
    )
  })

  it.each([
    ['hit', 'outline-green-500'],
    ['correct-rejection', 'outline-green-500'],
    ['miss', 'outline-red-500'],
    ['false-alarm', 'outline-red-500'],
  ] as const)('flashes the %s outline for the resolved outcome', (outcome, outlineClass) => {
    render(
      <StreamButtons
        activeStreams={['position', 'shape']}
        pressedStreams={new Set()}
        feedback={{ position: outcome }}
        onAssert={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /position/i }).className).toContain(outlineClass)
    expect(screen.getByRole('button', { name: /shape/i }).className).toContain(
      'outline-transparent',
    )
  })

  it('prioritizes feedback over the pressed outline once an outcome resolves', () => {
    render(
      <StreamButtons
        activeStreams={['position']}
        pressedStreams={new Set(['position'])}
        feedback={{ position: 'hit' }}
        onAssert={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /position/i }).className).toContain(
      'outline-green-500',
    )
  })
})
