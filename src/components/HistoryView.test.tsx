import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
    fireEvent.click(screen.getByRole('tab', { name: 'Log' }))

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
    expect(within(screen.getByRole('table')).getByText('75%')).toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('tab', { name: 'Log' }))

    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.queryByText('40')).not.toBeInTheDocument()
  })

  it('computes KPIs from recorded history and renders the trend chart legend', () => {
    appendHistoryRecord({ timestamp: '2026-07-01T12:00:00.000Z', config: { ...config, n: 2 }, summary: { ...summary, accuracy: 0.6 } })
    appendHistoryRecord({ timestamp: '2026-07-05T12:00:00.000Z', config: { ...config, n: 4 }, summary: { ...summary, accuracy: 0.8 } })

    render(<HistoryView />)

    expect(within(screen.getByRole('group', { name: 'Sessions' })).getByText('2')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Avg accuracy' })).getByText('70%')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Peak level' })).getByText('4')).toBeInTheDocument()
    expect(screen.getByText('Accuracy (%)')).toBeInTheDocument()
    expect(screen.getByText('N-back level')).toBeInTheDocument()
  })

  describe('streak and today stats', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('shows an outlined streak through yesterday and zero today stats when no session has completed today', () => {
      appendHistoryRecord({ timestamp: '2026-07-12T09:00:00.000Z', config, summary })
      appendHistoryRecord({ timestamp: '2026-07-13T09:00:00.000Z', config, summary })
      vi.setSystemTime(new Date('2026-07-14T08:00:00'))

      render(<HistoryView />)

      const streakTile = screen.getByRole('group', { name: 'Day streak' })
      expect(within(streakTile).getByText('2')).toBeInTheDocument()
      expect(within(streakTile).getByRole('img', { hidden: true }).getAttribute('fill')).toBe('none')
      expect(within(screen.getByRole('group', { name: "Today's time" })).getByText('0s')).toBeInTheDocument()
      expect(within(screen.getByRole('group', { name: "Today's sessions" })).getByText('0')).toBeInTheDocument()
    })

    it('shows a filled streak and today stats once a session has completed today', () => {
      appendHistoryRecord({ timestamp: '2026-07-13T09:00:00.000Z', config, summary })
      appendHistoryRecord({ timestamp: '2026-07-14T09:00:00.000Z', config, summary })
      vi.setSystemTime(new Date('2026-07-14T20:00:00'))

      render(<HistoryView />)

      const streakTile = screen.getByRole('group', { name: 'Day streak' })
      expect(within(streakTile).getByText('2')).toBeInTheDocument()
      expect(within(streakTile).getByRole('img', { hidden: true }).getAttribute('fill')).toBe('currentColor')
      expect(within(screen.getByRole('group', { name: "Today's time" })).getByText('50s')).toBeInTheDocument()
      expect(within(screen.getByRole('group', { name: "Today's sessions" })).getByText('1')).toBeInTheDocument()
    })
  })

  it('defaults to the overview tab and switches to the log tab on click', () => {
    appendHistoryRecord({ timestamp: '2026-07-08T12:00:00.000Z', config, summary })

    render(<HistoryView />)

    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Log' }))

    expect(screen.getByRole('tab', { name: 'Log' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})
