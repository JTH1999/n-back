import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import * as settingsStorage from './persistence/settingsStorage'
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

    const sidebar = screen.getByRole('navigation', { name: 'Main' })

    fireEvent.click(within(sidebar).getByRole('button', { name: 'History' }))
    expect(screen.queryByText(/trial \d+ of 5/i)).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    fireEvent.click(within(sidebar).getByRole('button', { name: 'Train' }))

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

    const sidebar = screen.getByRole('navigation', { name: 'Main' })
    fireEvent.click(within(sidebar).getByRole('button', { name: 'Settings' }))
    fireEvent.click(within(sidebar).getByRole('button', { name: 'Train' }))

    expect(screen.getByText(/session results/i)).toBeInTheDocument()
  })
})

describe('App shared draft config', () => {
  beforeEach(() => {
    window.localStorage.clear()
    saveDraftSettings(fastConfig)
  })

  it('keeps an edited training param in memory when navigating to Settings and back', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText(/n-back level/i), { target: { value: '5' } })

    const loadDraftSettingsSpy = vi.spyOn(settingsStorage, 'loadDraftSettings')

    const sidebar = screen.getByRole('navigation', { name: 'Main' })
    fireEvent.click(within(sidebar).getByRole('button', { name: 'Settings' }))
    fireEvent.click(within(sidebar).getByRole('button', { name: 'Train' }))

    expect(screen.getByLabelText(/n-back level/i)).toHaveValue(5)
    expect(loadDraftSettingsSpy).not.toHaveBeenCalled()
  })
})

describe('App summary actions', () => {
  beforeEach(() => {
    window.localStorage.clear()
    saveDraftSettings(fastConfig)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts a new session at the adjusted N when Play Again is clicked, with adaptive mode off', () => {
    saveDraftSettings({ ...fastConfig, trialCount: 1 })
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))
    act(() => {
      vi.advanceTimersByTime(fastConfig.trialLengthMs)
    })
    expect(screen.getByText(/session results/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /increase n/i }))
    fireEvent.click(screen.getByRole('button', { name: /play again/i }))

    expect(screen.getByText('N = 2')).toBeInTheDocument()
    expect(screen.getByText(/trial 1 of 1/i)).toBeInTheDocument()
  })

  it('returns to the setup screen with the adjusted N when Return to Setup is clicked', () => {
    saveDraftSettings({ ...fastConfig, trialCount: 1 })
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))
    act(() => {
      vi.advanceTimersByTime(fastConfig.trialLengthMs)
    })

    fireEvent.click(screen.getByRole('button', { name: /increase n/i }))
    fireEvent.click(screen.getByRole('button', { name: /return to setup/i }))

    expect(screen.getByLabelText(/n-back level/i)).toHaveValue(2)
  })

  it('seeds the stepper from the adaptive recommendation and applies it on Play Again', () => {
    saveDraftSettings({
      ...fastConfig,
      n: 1,
      trialCount: 2,
      matchRate: 1,
      adaptive: { enabled: true, lowerThreshold: 0.5, upperThreshold: 0.8 },
    })
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))
    act(() => {
      vi.advanceTimersByTime(fastConfig.trialLengthMs)
    })
    fireEvent.keyDown(window, { key: 'a' })
    act(() => {
      vi.advanceTimersByTime(fastConfig.trialLengthMs)
    })

    expect(screen.getByText(/session results/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/next session n-back level/i)).toHaveValue(2)

    fireEvent.click(screen.getByRole('button', { name: /play again/i }))

    expect(screen.getByText('N = 2')).toBeInTheDocument()
  })

  it('keeps the setup screen in sync after looping through multiple Play Again cycles', () => {
    saveDraftSettings({ ...fastConfig, trialCount: 1 })
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))
    act(() => {
      vi.advanceTimersByTime(fastConfig.trialLengthMs)
    })
    fireEvent.click(screen.getByRole('button', { name: /increase n/i }))
    fireEvent.click(screen.getByRole('button', { name: /play again/i }))

    expect(screen.getByText('N = 2')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(fastConfig.trialLengthMs)
    })
    expect(screen.getByText(/session results/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /increase n/i }))
    fireEvent.click(screen.getByRole('button', { name: /play again/i }))

    expect(screen.getByText('N = 3')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /abort/i }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: /abort/i }))

    expect(screen.getByLabelText(/n-back level/i)).toHaveValue(3)
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
    const streakCount = () => within(streakGroup()).getByText('Day streak').previousElementSibling
    const sessionCount = () => within(streakGroup()).getByText('sessions').nextElementSibling
    expect(streakCount()).toHaveTextContent('0')
    expect(sessionCount()).toHaveTextContent('0')

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))
    act(() => {
      vi.advanceTimersByTime(fastConfig.trialLengthMs)
    })

    expect(screen.getByText(/session results/i)).toBeInTheDocument()
    expect(streakCount()).toHaveTextContent('1')
    expect(sessionCount()).toHaveTextContent('1')
  })
})
