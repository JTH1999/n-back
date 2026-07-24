import { describe, expect, it } from 'vitest'
import type { SessionHistoryRecord } from '../persistence/historyStorage'
import { computeStreakStats } from './streakStats'

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

describe('computeStreakStats', () => {
  it('reports zero streak and today stats for empty history', () => {
    const stats = computeStreakStats([], new Date('2026-07-14T12:00:00'))

    expect(stats).toEqual({
      currentStreak: 0,
      streakActiveToday: false,
      todaysTotalTimeMs: 0,
      todaysSessionCount: 0,
    })
  })

  it('counts todays streak day as active and increments once a session completes today', () => {
    const history = [record('2026-07-13T09:00:00'), record('2026-07-14T09:00:00')]

    const stats = computeStreakStats(history, new Date('2026-07-14T20:00:00'))

    expect(stats.streakActiveToday).toBe(true)
    expect(stats.currentStreak).toBe(2)
  })

  it('reflects the streak through yesterday, not yet incremented or broken, when no session has completed today', () => {
    const history = [record('2026-07-12T09:00:00'), record('2026-07-13T09:00:00')]

    const stats = computeStreakStats(history, new Date('2026-07-14T08:00:00'))

    expect(stats.streakActiveToday).toBe(false)
    expect(stats.currentStreak).toBe(2)
  })

  it('breaks the streak once a full day has elapsed with zero completed sessions', () => {
    const history = [record('2026-07-10T09:00:00'), record('2026-07-11T09:00:00')]

    const stats = computeStreakStats(history, new Date('2026-07-14T08:00:00'))

    expect(stats.streakActiveToday).toBe(false)
    expect(stats.currentStreak).toBe(0)
  })

  it('only counts the consecutive run ending at the most recent completed day, ignoring older gaps', () => {
    const history = [
      record('2026-07-01T09:00:00'),
      record('2026-07-05T09:00:00'),
      record('2026-07-06T09:00:00'),
      record('2026-07-07T09:00:00'),
    ]

    const stats = computeStreakStats(history, new Date('2026-07-07T20:00:00'))

    expect(stats.currentStreak).toBe(3)
  })

  it('treats multiple sessions on the same local day as a single streak day', () => {
    const history = [record('2026-07-14T01:00:00'), record('2026-07-14T23:00:00')]

    const stats = computeStreakStats(history, new Date('2026-07-14T23:30:00'))

    expect(stats.currentStreak).toBe(1)
  })

  it('sums todays total time and session count from only todays completed sessions', () => {
    const history = [
      record('2026-07-13T09:00:00', { trialCount: 20, trialLengthMs: 2500 }),
      record('2026-07-14T09:00:00', { trialCount: 20, trialLengthMs: 2500 }),
      record('2026-07-14T15:00:00', { trialCount: 10, trialLengthMs: 3000 }),
    ]

    const stats = computeStreakStats(history, new Date('2026-07-14T20:00:00'))

    expect(stats.todaysSessionCount).toBe(2)
    expect(stats.todaysTotalTimeMs).toBe(20 * 2500 + 10 * 3000)
  })
})
