import { describe, expect, it } from 'vitest'
import type { SessionHistoryRecord } from '../persistence/historyStorage'
import { computeActivityGraph, GRID_ROWS, GRID_WEEKS } from './activityGraph'

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

describe('computeActivityGraph', () => {
  it('always returns a fixed 53-week x 7-day grid, regardless of history size', () => {
    const grid = computeActivityGraph([], new Date('2026-07-14T12:00:00'))

    expect(grid).toHaveLength(GRID_WEEKS)
    grid.forEach((week) => expect(week).toHaveLength(GRID_ROWS))
  })

  it('marks days with no sessions as zero-count, zero-time', () => {
    const grid = computeActivityGraph([], new Date('2026-07-14T12:00:00'))

    const allDays = grid.flat()
    expect(allDays.every((day) => day.sessionCount === 0 && day.totalTimeMs === 0)).toBe(true)
  })

  it("buckets a single session into that session's local day", () => {
    const history = [record('2026-07-14T09:00:00')]

    const grid = computeActivityGraph(history, new Date('2026-07-14T12:00:00'))

    const day = grid.flat().find((d) => d.dateKey === '2026-6-14')
    expect(day?.sessionCount).toBe(1)
    expect(day?.totalTimeMs).toBe(20 * 2500)
  })

  it('sums multiple sessions completed on the same local day', () => {
    const history = [
      record('2026-07-14T01:00:00', { trialCount: 20, trialLengthMs: 2500 }),
      record('2026-07-14T23:00:00', { trialCount: 10, trialLengthMs: 3000 }),
    ]

    const grid = computeActivityGraph(history, new Date('2026-07-14T23:30:00'))

    const day = grid.flat().find((d) => d.dateKey === '2026-6-14')
    expect(day?.sessionCount).toBe(2)
    expect(day?.totalTimeMs).toBe(20 * 2500 + 10 * 3000)
  })

  it('keeps sessions on different local days in separate buckets', () => {
    const history = [record('2026-07-13T23:59:00'), record('2026-07-14T00:01:00')]

    const grid = computeActivityGraph(history, new Date('2026-07-14T12:00:00'))

    const day13 = grid.flat().find((d) => d.dateKey === '2026-6-13')
    const day14 = grid.flat().find((d) => d.dateKey === '2026-6-14')
    expect(day13?.sessionCount).toBe(1)
    expect(day14?.sessionCount).toBe(1)
  })

  it('places the day matching "now" as the last day of the last week', () => {
    const grid = computeActivityGraph([], new Date('2026-07-14T12:00:00'))

    const lastWeek = grid[grid.length - 1]
    const todayIndex = new Date('2026-07-14T12:00:00').getDay()
    expect(lastWeek[todayIndex].dateKey).toBe('2026-6-14')
  })

  it('ignores sessions that fall outside the trailing 12-month window', () => {
    const history = [record('2020-01-01T09:00:00')]

    const grid = computeActivityGraph(history, new Date('2026-07-14T12:00:00'))

    const total = grid.flat().reduce((sum, day) => sum + day.sessionCount, 0)
    expect(total).toBe(0)
  })
})
