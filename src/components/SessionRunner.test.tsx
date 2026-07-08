import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessionRunnerConfig } from '../adapters/useSessionRunner'
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

describe('SessionRunner live feedback', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a per-stream feedback indicator once a trial resolves, when enabled', () => {
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

    expect(screen.queryByTestId('feedback-position')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.getByTestId('feedback-position')).toBeInTheDocument()
  })

  it('never shows a feedback indicator when disabled', () => {
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

    expect(screen.queryByTestId('feedback-position')).not.toBeInTheDocument()
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

    expect(screen.getByTestId('feedback-position')).toBeInTheDocument()
    expect(screen.queryByText(/session complete/i)).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(100)
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
