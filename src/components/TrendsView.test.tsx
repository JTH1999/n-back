import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { appendHistoryRecord } from '../persistence/historyStorage'
import { TrendsView } from './TrendsView'

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

beforeEach(() => {
  window.localStorage.clear()
})

describe('TrendsView', () => {
  it('shows an empty state and zeroed KPIs when no sessions have been recorded', () => {
    render(<TrendsView />)

    expect(screen.getByText(/no completed sessions yet/i)).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Sessions' })).getByText('0')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Peak level' })).getByText('0')).toBeInTheDocument()
  })

  it('computes KPIs from recorded history and renders the chart legend', () => {
    appendHistoryRecord({ timestamp: '2026-07-01T12:00:00.000Z', config: { ...config, n: 2 }, summary: { ...summary, accuracy: 0.6 } })
    appendHistoryRecord({ timestamp: '2026-07-05T12:00:00.000Z', config: { ...config, n: 4 }, summary: { ...summary, accuracy: 0.8 } })

    render(<TrendsView />)

    expect(within(screen.getByRole('group', { name: 'Sessions' })).getByText('2')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Avg accuracy' })).getByText('70%')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Peak level' })).getByText('4')).toBeInTheDocument()
    expect(screen.getByText('Accuracy (%)')).toBeInTheDocument()
    expect(screen.getByText('N-back level')).toBeInTheDocument()
  })
})
