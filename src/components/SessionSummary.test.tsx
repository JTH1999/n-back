import { render, screen, within } from '@testing-library/react'
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
        onRetry={vi.fn()}
        onDone={vi.fn()}
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
        onRetry={vi.fn()}
        onDone={vi.fn()}
      />,
    )

    expect(screen.queryByRole('group', { name: /day streak/i })).not.toBeInTheDocument()
  })
})
