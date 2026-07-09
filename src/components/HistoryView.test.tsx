import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
  it('shows an empty state when no sessions have been recorded', () => {
    render(<HistoryView onBack={vi.fn()} resolvedTheme="light" />)

    expect(screen.getByText(/no completed sessions yet/i)).toBeInTheDocument()
  })

  it('lists recorded sessions with key details', () => {
    appendHistoryRecord({ timestamp: '2026-07-08T12:00:00.000Z', config, summary })

    render(<HistoryView onBack={vi.fn()} resolvedTheme="light" />)

    expect(screen.getByText(/75% accuracy/i)).toBeInTheDocument()
    expect(screen.getByText(/N=3/)).toBeInTheDocument()
  })
})
