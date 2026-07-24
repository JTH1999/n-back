import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GRID_ROWS, GRID_WEEKS } from '../derived/activityGraph'
import type { SessionHistoryRecord } from '../persistence/historyStorage'
import { ActivityGraph } from './ActivityGraph'

const config = {
  n: 3,
  trialCount: 20,
  streams: ['position' as const],
  displayDurationMs: 500,
  trialLengthMs: 2500,
  volume: 1,
  muted: false,
  liveFeedback: false,
  adaptive: { enabled: false, lowerThreshold: 0.5, upperThreshold: 0.8 },
}

const summary = {
  totalTrials: 20,
  accuracy: 0.75,
  streams: {
    position: {
      kind: 'position' as const,
      totalTrials: 20,
      hits: 10,
      misses: 2,
      falseAlarms: 3,
      correctRejections: 5,
      accuracy: 0.75,
    },
  },
}

function record(timestamp: string, overrides: Partial<SessionHistoryRecord['config']> = {}): SessionHistoryRecord {
  return { id: timestamp, timestamp, config: { ...config, ...overrides }, summary }
}

describe('ActivityGraph', () => {
  it('renders a fixed 53x7 grid of cells regardless of history', () => {
    const { container } = render(<ActivityGraph history={[]} now={new Date('2026-07-14T12:00:00')} />)

    expect(container.querySelectorAll('[data-level]')).toHaveLength(GRID_WEEKS * GRID_ROWS)
  })

  it('renders empty days at the lowest intensity level', () => {
    render(<ActivityGraph history={[]} now={new Date('2026-07-14T12:00:00')} />)

    expect(screen.getByTitle('Jul 14, 2026: no sessions')).toHaveAttribute('data-level', '0')
  })

  it('gives a day with sessions a higher intensity level than an empty day', () => {
    const history = [record('2026-07-14T09:00:00')]

    render(<ActivityGraph history={history} now={new Date('2026-07-14T12:00:00')} />)

    const activeDay = screen.getByTitle('Jul 14, 2026: 1 session')
    expect(activeDay).toHaveAttribute('data-level', '1')
    expect(screen.getByTitle('Jul 13, 2026: no sessions')).toHaveAttribute('data-level', '0')
  })

  it('defaults to the session-count metric and switches to total time on toggle', () => {
    const history = [record('2026-07-14T09:00:00', { trialCount: 20, trialLengthMs: 2500 })]

    render(<ActivityGraph history={history} now={new Date('2026-07-14T12:00:00')} />)

    expect(screen.getByRole('button', { name: 'Session count' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTitle('Jul 14, 2026: 1 session')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Total time' }))

    expect(screen.getByRole('button', { name: 'Total time' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTitle('Jul 14, 2026: 50s practiced')).toBeInTheDocument()
  })
})
