import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StreamButtons } from './StreamButtons'

const keymap = { position: 'g', shape: 's', color: 'd', letter: 'f' }

describe('StreamButtons', () => {
  it('renders a labeled button for each active stream', () => {
    render(
      <StreamButtons
        activeStreams={['position', 'color']}
        pressedStreams={new Set()}
        keymap={keymap}
        onAssert={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /position/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /color/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /shape/i })).not.toBeInTheDocument()
  })

  it('shows the bound key for each button', () => {
    render(
      <StreamButtons
        activeStreams={['position', 'letter']}
        pressedStreams={new Set()}
        keymap={keymap}
        onAssert={vi.fn()}
      />,
    )

    expect(screen.getByText('G')).toBeInTheDocument()
    expect(screen.getByText('F')).toBeInTheDocument()
  })

  it('dispatches an assert-match action for the tapped stream', () => {
    const onAssert = vi.fn()
    render(
      <StreamButtons
        activeStreams={['position', 'letter']}
        pressedStreams={new Set()}
        keymap={keymap}
        onAssert={onAssert}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /letter/i }))

    expect(onAssert).toHaveBeenCalledWith('letter')
    expect(onAssert).toHaveBeenCalledTimes(1)
  })

  it('dispatches an assert-match action on a touch pointer-down', () => {
    const onAssert = vi.fn()
    render(
      <StreamButtons
        activeStreams={['position', 'letter']}
        pressedStreams={new Set()}
        keymap={keymap}
        onAssert={onAssert}
      />,
    )

    fireEvent.pointerDown(screen.getByRole('button', { name: /letter/i }), {
      pointerType: 'touch',
    })

    expect(onAssert).toHaveBeenCalledWith('letter')
    expect(onAssert).toHaveBeenCalledTimes(1)
  })

  it('does not double-fire when a touch pointer-down is followed by the compatibility click', () => {
    const onAssert = vi.fn()
    render(
      <StreamButtons
        activeStreams={['position', 'letter']}
        pressedStreams={new Set()}
        keymap={keymap}
        onAssert={onAssert}
      />,
    )

    const button = screen.getByRole('button', { name: /letter/i })
    fireEvent.pointerDown(button, { pointerType: 'touch' })
    fireEvent.click(button)

    expect(onAssert).toHaveBeenCalledTimes(1)
  })

  it('does not assert on a mouse pointer-down, only on the paired click', () => {
    const onAssert = vi.fn()
    render(
      <StreamButtons
        activeStreams={['position', 'letter']}
        pressedStreams={new Set()}
        keymap={keymap}
        onAssert={onAssert}
      />,
    )

    const button = screen.getByRole('button', { name: /letter/i })
    fireEvent.pointerDown(button, { pointerType: 'mouse' })
    expect(onAssert).not.toHaveBeenCalled()

    fireEvent.click(button)
    expect(onAssert).toHaveBeenCalledWith('letter')
    expect(onAssert).toHaveBeenCalledTimes(1)
  })

  it('registers independent touch pointer-downs on two different buttons', () => {
    const onAssert = vi.fn()
    render(
      <StreamButtons
        activeStreams={['position', 'letter']}
        pressedStreams={new Set()}
        keymap={keymap}
        onAssert={onAssert}
      />,
    )

    fireEvent.pointerDown(screen.getByRole('button', { name: /position/i }), {
      pointerType: 'touch',
    })
    fireEvent.pointerDown(screen.getByRole('button', { name: /letter/i }), {
      pointerType: 'touch',
    })

    expect(onAssert).toHaveBeenCalledWith('position')
    expect(onAssert).toHaveBeenCalledWith('letter')
    expect(onAssert).toHaveBeenCalledTimes(2)
  })

  it('does not double-fire either button when two compatibility clicks arrive interleaved', () => {
    const onAssert = vi.fn()
    render(
      <StreamButtons
        activeStreams={['position', 'letter']}
        pressedStreams={new Set()}
        keymap={keymap}
        onAssert={onAssert}
      />,
    )

    const positionButton = screen.getByRole('button', { name: /position/i })
    const letterButton = screen.getByRole('button', { name: /letter/i })

    fireEvent.pointerDown(positionButton, { pointerType: 'touch' })
    fireEvent.pointerDown(letterButton, { pointerType: 'touch' })
    fireEvent.click(positionButton)
    fireEvent.click(letterButton)

    expect(onAssert).toHaveBeenCalledWith('position')
    expect(onAssert).toHaveBeenCalledWith('letter')
    expect(onAssert).toHaveBeenCalledTimes(2)
  })

  it('shows an ack flash only for streams marked as pressed', () => {
    render(
      <StreamButtons
        activeStreams={['position', 'letter']}
        pressedStreams={new Set(['letter'])}
        keymap={keymap}
        onAssert={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /letter/i })).toHaveAttribute(
      'data-feedback',
      'ack',
    )
    expect(screen.getByRole('button', { name: /position/i })).not.toHaveAttribute(
      'data-feedback',
    )
  })

  it('shows no feedback flash when none is provided', () => {
    render(
      <StreamButtons
        activeStreams={['position']}
        pressedStreams={new Set()}
        keymap={keymap}
        onAssert={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /position/i })).not.toHaveAttribute(
      'data-feedback',
    )
  })

  it.each([
    ['hit', 'correct'],
    ['miss', 'wrong'],
    ['false-alarm', 'wrong'],
  ] as const)('flashes %s as %s', (outcome, flash) => {
    render(
      <StreamButtons
        activeStreams={['position', 'shape']}
        pressedStreams={new Set()}
        keymap={keymap}
        feedback={{ position: outcome }}
        onAssert={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /position/i })).toHaveAttribute(
      'data-feedback',
      flash,
    )
    expect(screen.getByRole('button', { name: /shape/i })).not.toHaveAttribute('data-feedback')
  })

  it('shows no feedback flash for a correct rejection', () => {
    render(
      <StreamButtons
        activeStreams={['position']}
        pressedStreams={new Set()}
        keymap={keymap}
        feedback={{ position: 'correct-rejection' }}
        onAssert={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /position/i })).not.toHaveAttribute(
      'data-feedback',
    )
  })

  it('prioritizes feedback over the ack flash once an outcome resolves', () => {
    render(
      <StreamButtons
        activeStreams={['position']}
        pressedStreams={new Set(['position'])}
        keymap={keymap}
        feedback={{ position: 'hit' }}
        onAssert={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /position/i })).toHaveAttribute(
      'data-feedback',
      'correct',
    )
  })
})
