import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FEEDBACK_FLASH_MS,
  PRE_TRIAL_PAUSE_MS,
  useSessionRunner,
  type SessionRunnerConfig,
} from './useSessionRunner'

const config: SessionRunnerConfig = {
  n: 1,
  trialCount: 2,
  streams: ['position'],
  displayDurationMs: 100,
  trialLengthMs: 200,
  volume: 1,
  muted: true,
  liveFeedback: true,
  adaptive: { enabled: false, lowerThreshold: 0.5, upperThreshold: 0.8 },
}

describe('useSessionRunner input gating during the feedback pause', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('ignores assertions made during the feedback pause instead of crediting them to the next trial', () => {
    vi.useFakeTimers()
    // Deterministic, non-matching sequence: every trial is a correct-rejection unless asserted.
    vi.spyOn(Math, 'random').mockReturnValue(0.9)

    const { result } = renderHook(() => useSessionRunner(config))

    act(() => {
      vi.advanceTimersByTime(PRE_TRIAL_PAUSE_MS)
    })
    act(() => {
      vi.advanceTimersByTime(config.trialLengthMs)
    })

    expect(result.current.acceptingInput).toBe(false)

    act(() => {
      result.current.assertStreamMatch('position')
    })

    expect(result.current.state.streams.position!.responded[1]).toBe(false)

    act(() => {
      vi.advanceTimersByTime(FEEDBACK_FLASH_MS)
    })

    expect(result.current.acceptingInput).toBe(true)
    expect(result.current.state.streams.position!.responded[1]).toBe(false)
  })

  it('accepts assertions once the feedback pause ends and the next trial begins', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.9)

    const { result } = renderHook(() => useSessionRunner(config))

    act(() => {
      vi.advanceTimersByTime(PRE_TRIAL_PAUSE_MS)
    })
    act(() => {
      vi.advanceTimersByTime(config.trialLengthMs)
    })
    act(() => {
      vi.advanceTimersByTime(FEEDBACK_FLASH_MS)
    })

    act(() => {
      result.current.assertStreamMatch('position')
    })

    expect(result.current.state.streams.position!.responded[1]).toBe(true)
  })
})

describe('useSessionRunner pause and resume', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('stops the trial timer on pause without mutating the engine state', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useSessionRunner(config))

    act(() => {
      vi.advanceTimersByTime(PRE_TRIAL_PAUSE_MS)
    })
    act(() => {
      result.current.pause()
    })

    const trialIndexAtPause = result.current.state.currentTrialIndex

    act(() => {
      vi.advanceTimersByTime(config.trialLengthMs * 5)
    })

    expect(result.current.state.currentTrialIndex).toBe(trialIndexAtPause)
    expect(result.current.state.status).toBe('active')
    expect(result.current.paused).toBe(true)
  })

  it('rejects input while paused', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useSessionRunner(config))

    act(() => {
      vi.advanceTimersByTime(PRE_TRIAL_PAUSE_MS)
    })
    act(() => {
      result.current.pause()
    })

    expect(result.current.acceptingInput).toBe(false)
  })

  it('resumes the trial timer from exactly where it left off', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useSessionRunner(config))

    act(() => {
      vi.advanceTimersByTime(PRE_TRIAL_PAUSE_MS)
    })
    act(() => {
      vi.advanceTimersByTime(config.trialLengthMs - 20)
    })
    act(() => {
      result.current.pause()
    })

    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(result.current.state.currentTrialIndex).toBe(0)

    act(() => {
      result.current.resume()
    })

    act(() => {
      vi.advanceTimersByTime(19)
    })
    expect(result.current.state.currentTrialIndex).toBe(0)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.state.currentTrialIndex).toBe(1)
  })

  it('resumes the feedback pause from exactly where it left off', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useSessionRunner(config))

    act(() => {
      vi.advanceTimersByTime(PRE_TRIAL_PAUSE_MS)
    })
    act(() => {
      vi.advanceTimersByTime(config.trialLengthMs)
    })
    act(() => {
      vi.advanceTimersByTime(FEEDBACK_FLASH_MS - 50)
    })
    act(() => {
      result.current.pause()
    })

    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(result.current.acceptingInput).toBe(false)

    act(() => {
      result.current.resume()
    })

    act(() => {
      vi.advanceTimersByTime(49)
    })
    expect(result.current.acceptingInput).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.acceptingInput).toBe(true)
  })
})
