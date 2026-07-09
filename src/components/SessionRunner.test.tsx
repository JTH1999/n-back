import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FEEDBACK_FLASH_MS, type SessionRunnerConfig } from '../adapters/useSessionRunner'
import { loadHistory } from '../persistence/historyStorage'
import { loadDraftSettings } from '../persistence/settingsStorage'
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
  adaptive: { enabled: false, lowerThreshold: 0.5, upperThreshold: 0.8 },
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

describe('SessionRunner history persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('records a history entry once the summary is reached', () => {
    vi.useFakeTimers()
    render(
      <SessionRunner
        config={{ ...config, trialCount: 1, displayDurationMs: 100, trialLengthMs: 200 }}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(200)
    })

    const history = loadHistory()
    expect(history).toHaveLength(1)
    expect(history[0].config.n).toBe(config.n)
    expect(history[0].summary.totalTrials).toBe(1)
  })

  it('does not record history while a session is still in progress', () => {
    render(
      <SessionRunner
        config={{ ...config, trialCount: 5 }}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    expect(loadHistory()).toHaveLength(0)
  })
})

describe('SessionRunner adaptive mode', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('saves a recommended N to draft settings when accuracy exceeds the upper threshold', () => {
    vi.useFakeTimers()
    render(
      <SessionRunner
        config={{
          ...config,
          n: 1,
          trialCount: 1,
          displayDurationMs: 100,
          trialLengthMs: 200,
          adaptive: { enabled: true, lowerThreshold: 0.5, upperThreshold: 0.8 },
        }}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(loadDraftSettings<SessionRunnerConfig>()?.n).toBe(2)
  })

  it('clamps the recommended N to the maximum allowed level', () => {
    vi.useFakeTimers()
    render(
      <SessionRunner
        config={{
          ...config,
          n: 20,
          trialCount: 1,
          displayDurationMs: 100,
          trialLengthMs: 200,
          adaptive: { enabled: true, lowerThreshold: 0.5, upperThreshold: 0.8 },
        }}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(loadDraftSettings<SessionRunnerConfig>()?.n).toBe(20)
  })

  it('does not touch draft settings when adaptive mode is disabled', () => {
    vi.useFakeTimers()
    render(
      <SessionRunner
        config={{
          ...config,
          n: 1,
          trialCount: 1,
          displayDurationMs: 100,
          trialLengthMs: 200,
          adaptive: { enabled: false, lowerThreshold: 0.5, upperThreshold: 0.8 },
        }}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(loadDraftSettings<SessionRunnerConfig>()).toBeNull()
  })
})

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

describe('SessionRunner pause and resume', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('stops the trial from advancing while paused', () => {
    vi.useFakeTimers()
    render(
      <SessionRunner
        config={{ ...config, trialCount: 5, displayDurationMs: 100, trialLengthMs: 200 }}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /pause/i }))

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(screen.getByText(/trial 1 of 5/i)).toBeInTheDocument()
  })

  it('resumes advancing the trial after resume is clicked', () => {
    vi.useFakeTimers()
    render(
      <SessionRunner
        config={{ ...config, trialCount: 5, displayDurationMs: 100, trialLengthMs: 200 }}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /pause/i }))
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    fireEvent.click(screen.getByRole('button', { name: /resume/i }))

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.getByText(/trial 2 of 5/i)).toBeInTheDocument()
  })
})

describe('SessionRunner abort with confirmation', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not end the session when the confirmation is declined', () => {
    vi.useFakeTimers()
    const onRestart = vi.fn()
    render(
      <SessionRunner
        config={{ ...config, trialCount: 5, displayDurationMs: 100, trialLengthMs: 200 }}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={onRestart}
        confirmAbort={() => false}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /abort/i }))

    expect(onRestart).not.toHaveBeenCalled()
    expect(screen.getByText(/trial 1 of 5/i)).toBeInTheDocument()
  })

  it('ends the session without recording history when the confirmation is accepted', () => {
    vi.useFakeTimers()
    const onRestart = vi.fn()
    render(
      <SessionRunner
        config={{ ...config, trialCount: 5, displayDurationMs: 100, trialLengthMs: 200 }}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={onRestart}
        confirmAbort={() => true}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /abort/i }))

    expect(onRestart).toHaveBeenCalledTimes(1)
    expect(loadHistory()).toHaveLength(0)
  })
})
