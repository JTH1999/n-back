import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { SessionSummary as Summary } from '../engine/sessionEngine'
import { SessionSummary } from './SessionSummary'

const summary: Summary = {
  totalTrials: 20,
  accuracy: 0.75,
  streams: {
    position: {
      kind: 'position',
      totalTrials: 20,
      hits: 10,
      misses: 2,
      falseAlarms: 3,
      correctRejections: 5,
      accuracy: 0.75,
    },
  },
}

describe('SessionSummary streak badge', () => {
  it('renders the streak number and filled flame when a session has completed today', () => {
    render(
      <SessionSummary
        summary={summary}
        n={2}
        trialCount={20}
        recommendation={null}
        streak={{ currentStreak: 4, streakActiveToday: true, todaysTotalTimeMs: 0, todaysSessionCount: 1 }}
        onReturnToSetup={vi.fn()}
        onPlayAgain={vi.fn()}
      />,
    )

    const streakGroup = screen.getByRole('group', { name: /day streak/i })
    expect(within(streakGroup).getByText('4')).toBeInTheDocument()
  })

  it('renders nothing for the streak badge when streak data is not yet available', () => {
    render(
      <SessionSummary
        summary={summary}
        n={2}
        trialCount={20}
        recommendation={null}
        streak={null}
        onReturnToSetup={vi.fn()}
        onPlayAgain={vi.fn()}
      />,
    )

    expect(screen.queryByRole('group', { name: /day streak/i })).not.toBeInTheDocument()
  })
})

describe('SessionSummary next-session stepper', () => {
  it('always renders the stepper, seeded from the current N when there is no recommendation', () => {
    render(
      <SessionSummary
        summary={summary}
        n={3}
        trialCount={20}
        recommendation={null}
        streak={null}
        onReturnToSetup={vi.fn()}
        onPlayAgain={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(/next session n-back level/i)).toHaveValue(3)
  })

  it('seeds the stepper from the adaptive recommendation when one is present', () => {
    render(
      <SessionSummary
        summary={summary}
        n={3}
        trialCount={20}
        recommendation={{ n: 5, note: 'increased' }}
        streak={null}
        onReturnToSetup={vi.fn()}
        onPlayAgain={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(/next session n-back level/i)).toHaveValue(5)
  })

  it('clamps stepper adjustments to the valid [1, MAX_N] range', () => {
    render(
      <SessionSummary
        summary={summary}
        n={1}
        trialCount={20}
        recommendation={null}
        streak={null}
        onReturnToSetup={vi.fn()}
        onPlayAgain={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /decrease n/i }))
    expect(screen.getByLabelText(/next session n-back level/i)).toHaveValue(1)

    fireEvent.change(screen.getByLabelText(/next session n-back level/i), { target: { value: '999' } })
    expect(screen.getByLabelText(/next session n-back level/i)).toHaveValue(20)
  })

  it('shows the adaptive note only when a recommendation is present, and it does not change when the stepper is adjusted', () => {
    render(
      <SessionSummary
        summary={summary}
        n={3}
        trialCount={20}
        recommendation={{ n: 5, note: 'increased' }}
        streak={null}
        onReturnToSetup={vi.fn()}
        onPlayAgain={vi.fn()}
      />,
    )

    expect(screen.getByText(/n = 5/i)).toBeInTheDocument()
    expect(screen.getByText(/increased/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /increase n/i }))

    expect(screen.getByLabelText(/next session n-back level/i)).toHaveValue(6)
    expect(screen.getByText(/n = 5/i)).toBeInTheDocument()
    expect(screen.getByText(/increased/i)).toBeInTheDocument()
  })

  it('does not render the adaptive note when there is no recommendation', () => {
    render(
      <SessionSummary
        summary={summary}
        n={3}
        trialCount={20}
        recommendation={null}
        streak={null}
        onReturnToSetup={vi.fn()}
        onPlayAgain={vi.fn()}
      />,
    )

    expect(screen.queryByText(/increased|decreased|held steady/i)).not.toBeInTheDocument()
  })
})

describe('SessionSummary actions', () => {
  it('renders Return to Setup as ghost/secondary before Play Again as primary', () => {
    render(
      <SessionSummary
        summary={summary}
        n={3}
        trialCount={20}
        recommendation={null}
        streak={null}
        onReturnToSetup={vi.fn()}
        onPlayAgain={vi.fn()}
      />,
    )

    const buttons = screen.getAllByRole('button').filter((button) => /return to setup|play again/i.test(button.textContent ?? ''))
    expect(buttons).toHaveLength(2)
    expect(buttons[0]).toHaveTextContent(/return to setup/i)
    expect(buttons[1]).toHaveTextContent(/play again/i)
  })

  it('invokes onReturnToSetup with the stepper value when clicked', () => {
    const onReturnToSetup = vi.fn()
    render(
      <SessionSummary
        summary={summary}
        n={3}
        trialCount={20}
        recommendation={null}
        streak={null}
        onReturnToSetup={onReturnToSetup}
        onPlayAgain={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /increase n/i }))
    fireEvent.click(screen.getByRole('button', { name: /return to setup/i }))

    expect(onReturnToSetup).toHaveBeenCalledWith(4)
  })

  it('invokes onPlayAgain with the stepper value when clicked', () => {
    const onPlayAgain = vi.fn()
    render(
      <SessionSummary
        summary={summary}
        n={3}
        trialCount={20}
        recommendation={{ n: 5, note: 'increased' }}
        streak={null}
        onReturnToSetup={vi.fn()}
        onPlayAgain={onPlayAgain}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /decrease n/i }))
    fireEvent.click(screen.getByRole('button', { name: /play again/i }))

    expect(onPlayAgain).toHaveBeenCalledWith(4)
  })
})
