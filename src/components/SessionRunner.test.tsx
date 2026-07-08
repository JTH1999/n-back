import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FEEDBACK_FLASH_MS, type SessionRunnerConfig } from '../adapters/useSessionRunner'
import { SessionRunner } from './SessionRunner'

const config: SessionRunnerConfig = {
  n: 1,
  trialCount: 5,
  streams: ['position'],
  displayDurationMs: 60_000,
  trialLengthMs: 60_000,
  volume: 1,
  muted: true,
  liveFeedback: false,
}

describe('SessionRunner keyboard handling', () => {
  it('asserts a match for the stream bound to the pressed key', () => {
    render(
      <SessionRunner
        config={config}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    expect(screen.getByText('G')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'g' })

    expect(screen.getByRole('button', { name: /position/i }).className).toContain(
      'outline-slate-900',
    )
  })

  it('ignores keys not present in the keymap', () => {
    render(
      <SessionRunner
        config={config}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    fireEvent.keyDown(window, { key: 'a' })

    expect(screen.getByRole('button', { name: /position/i }).className).toContain(
      'outline-transparent',
    )
  })
})

function positionButtonOutline() {
  return screen.getByRole('button', { name: /position/i }).className
}

describe('SessionRunner live feedback', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('flashes the outline for the resolved outcome, when enabled', () => {
    vi.useFakeTimers()
    render(
      <SessionRunner
        config={{
          ...config,
          trialCount: 2,
          displayDurationMs: 100,
          trialLengthMs: 200,
          liveFeedback: true,
        }}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    expect(positionButtonOutline()).toContain('outline-transparent')

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(positionButtonOutline()).toMatch(/outline-(green|red)-500/)
  })

  it('never flashes a feedback outline when disabled', () => {
    vi.useFakeTimers()
    render(
      <SessionRunner
        config={{
          ...config,
          trialCount: 2,
          displayDurationMs: 100,
          trialLengthMs: 200,
          liveFeedback: false,
        }}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(positionButtonOutline()).toContain('outline-transparent')
  })

  it('pauses between trials to show feedback, without overlapping the next stimulus', () => {
    vi.useFakeTimers()
    render(
      <SessionRunner
        config={{
          ...config,
          trialCount: 2,
          displayDurationMs: 100,
          trialLengthMs: 200,
          liveFeedback: true,
        }}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    // Trial 1 ends at 200ms; feedback pause should follow, not the next stimulus.
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(positionButtonOutline()).toMatch(/outline-(green|red)-500/)
    expect(screen.getByText(/trial 2 of 2/i)).toBeInTheDocument()

    // Still within the feedback pause: no next-trial stimulus overlap yet.
    act(() => {
      vi.advanceTimersByTime(FEEDBACK_FLASH_MS / 2)
    })
    expect(positionButtonOutline()).toMatch(/outline-(green|red)-500/)

    // Feedback pause elapses; trial 2 begins now.
    act(() => {
      vi.advanceTimersByTime(FEEDBACK_FLASH_MS / 2)
    })
    expect(positionButtonOutline()).toContain('outline-transparent')
  })

  it('shows feedback for the final trial before revealing the summary', () => {
    vi.useFakeTimers()
    render(
      <SessionRunner
        config={{
          ...config,
          trialCount: 1,
          displayDurationMs: 100,
          trialLengthMs: 200,
          liveFeedback: true,
        }}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(positionButtonOutline()).toMatch(/outline-(green|red)-500/)
    expect(screen.queryByText(/session complete/i)).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(FEEDBACK_FLASH_MS)
    })

    expect(screen.getByText(/session complete/i)).toBeInTheDocument()
  })

  it('reveals the summary immediately after the final trial when disabled', () => {
    vi.useFakeTimers()
    render(
      <SessionRunner
        config={{
          ...config,
          trialCount: 1,
          displayDurationMs: 100,
          trialLengthMs: 200,
          liveFeedback: false,
        }}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.getByText(/session complete/i)).toBeInTheDocument()
  })
})
