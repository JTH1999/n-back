import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FEEDBACK_FLASH_MS, useSessionRunner, type SessionRunnerConfig } from './useSessionRunner'

const config: SessionRunnerConfig = {
  n: 1,
  trialCount: 2,
  streams: ['position'],
  displayDurationMs: 100,
  trialLengthMs: 200,
  volume: 1,
  muted: true,
  liveFeedback: true,
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
