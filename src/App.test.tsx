import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { saveDraftSettings } from './persistence/settingsStorage'
import type { SessionRunnerConfig } from './hooks/useSessionRunner'

const fastConfig: SessionRunnerConfig = {
  n: 1,
  trialCount: 5,
  streams: ['position'],
  displayDurationMs: 100,
  trialLengthMs: 200,
  volume: 1,
  muted: true,
  liveFeedback: false,
  adaptive: { enabled: false, lowerThreshold: 0.5, upperThreshold: 0.8 },
}

describe('App navigation during a session', () => {
  beforeEach(() => {
    window.localStorage.clear()
    saveDraftSettings(fastConfig)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pauses the session instead of letting it keep running when navigating to another tab', () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))
    expect(screen.getByText(/trial 1 of 5/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Presets' }))
    expect(screen.queryByText(/trial \d+ of 5/i)).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Train' }))

    expect(screen.getByText(/trial 1 of 5/i)).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: /session paused/i })).toBeInTheDocument()
  })

  it('keeps showing the results screen after navigating away and back, instead of starting a new session', () => {
    saveDraftSettings({ ...fastConfig, trialCount: 1 })
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))

    act(() => {
      vi.advanceTimersByTime(fastConfig.trialLengthMs)
    })

    expect(screen.getByText(/session results/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    fireEvent.click(screen.getByRole('button', { name: 'Train' }))

    expect(screen.getByText(/session results/i)).toBeInTheDocument()
  })
})

describe('App nav bar streak', () => {
  beforeEach(() => {
    window.localStorage.clear()
    saveDraftSettings(fastConfig)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reflects the updated streak and today stats in the nav bar after a session completes', () => {
    saveDraftSettings({ ...fastConfig, trialCount: 1 })
    vi.useFakeTimers()
    render(<App />)

    const streakGroup = () => screen.getByRole('group', { name: "Streak and today's stats" })
    expect(within(streakGroup()).getByText('0')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))
    act(() => {
      vi.advanceTimersByTime(fastConfig.trialLengthMs)
    })

    expect(screen.getByText(/session results/i)).toBeInTheDocument()
    expect(within(streakGroup()).getByText('1')).toBeInTheDocument()
    expect(within(streakGroup()).getByText('1 today')).toBeInTheDocument()
  })
})
