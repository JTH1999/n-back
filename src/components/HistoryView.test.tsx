import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { appendHistoryRecord } from '../persistence/historyStorage'
import { HistoryView } from './HistoryView'

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

describe('HistoryView', () => {
  it('shows an empty state and a zero session count when no sessions have been recorded', () => {
    render(<HistoryView />)

    expect(screen.getByText(/no completed sessions yet/i)).toBeInTheDocument()
    expect(screen.getByText(/0 sessions/i)).toBeInTheDocument()
  })

  it('renders recorded sessions as a table with the session count in the header', () => {
    appendHistoryRecord({ timestamp: '2026-07-08T12:00:00.000Z', config, summary })

    render(<HistoryView />)

    expect(screen.getByText(/1 sessions/i)).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /date/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /streams/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /^n$/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /trials/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /acc/i })).toBeInTheDocument()
    expect(screen.getByText('N=3')).toBeInTheDocument()
    expect(screen.getByText('position')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('shows the session trial count, not the per-stream judged-slot total', () => {
    const twoStreamConfig = { ...config, trialCount: 20, streams: ['position' as const, 'shape' as const] }
    const twoStreamSummary = {
      ...summary,
      totalTrials: 40,
      streams: { ...summary.streams, shape: { ...summary.streams.position, kind: 'shape' as const } },
    }
    appendHistoryRecord({ timestamp: '2026-07-08T12:00:00.000Z', config: twoStreamConfig, summary: twoStreamSummary })

    render(<HistoryView />)

    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.queryByText('40')).not.toBeInTheDocument()
  })
})
