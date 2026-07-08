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

  it('shows no feedback indicator when no feedback is provided', () => {
    render(
      <StreamButtons
        activeStreams={['position']}
        pressedStreams={new Set()}
        onAssert={vi.fn()}
      />,
    )

    expect(screen.queryByTestId('feedback-position')).not.toBeInTheDocument()
  })

  it.each([
    ['hit', 'bg-green-500'],
    ['correct-rejection', 'bg-green-500'],
    ['miss', 'bg-red-500'],
    ['false-alarm', 'bg-red-500'],
  ] as const)('renders a %s indicator with the expected color', (outcome, colorClass) => {
    render(
      <StreamButtons
        activeStreams={['position', 'shape']}
        pressedStreams={new Set()}
        feedback={{ position: outcome }}
        onAssert={vi.fn()}
      />,
    )

    expect(screen.getByTestId('feedback-position').className).toContain(colorClass)
    expect(screen.queryByTestId('feedback-shape')).not.toBeInTheDocument()
  })
})
