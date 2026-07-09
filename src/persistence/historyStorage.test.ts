import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionRunnerConfig } from '../adapters/useSessionRunner'
import type { SessionSummary } from '../engine/sessionEngine'
import { appendHistoryRecord, loadHistory } from './historyStorage'

const config: SessionRunnerConfig = {
  n: 2,
  trialCount: 20,
  streams: ['position'],
  displayDurationMs: 500,
  trialLengthMs: 2500,
  volume: 1,
  muted: false,
  liveFeedback: false,
  adaptive: { enabled: false, lowerThreshold: 0.5, upperThreshold: 0.8 },
}

const summary: SessionSummary = {
  totalTrials: 20,
  accuracy: 0.9,
  streams: {
    position: {
      kind: 'position',
      totalTrials: 20,
      hits: 5,
      misses: 1,
      falseAlarms: 1,
      correctRejections: 13,
      accuracy: 0.9,
    },
  },
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('loadHistory', () => {
  it('returns an empty array when nothing has been saved', () => {
    expect(loadHistory()).toEqual([])
  })

  it('returns an empty array if the stored value is not valid JSON', () => {
    window.localStorage.setItem('n-back:session-history', 'not json')

    expect(loadHistory()).toEqual([])
  })
})

describe('appendHistoryRecord', () => {
  it('appends a record and persists it across loads', () => {
    const record = { timestamp: '2026-07-08T12:00:00.000Z', config, summary }

    appendHistoryRecord(record)

    expect(loadHistory()).toEqual([record])
  })

  it('preserves existing records when appending a new one', () => {
    const first = { timestamp: '2026-07-08T12:00:00.000Z', config, summary }
    const second = { timestamp: '2026-07-08T12:05:00.000Z', config, summary }

    appendHistoryRecord(first)
    appendHistoryRecord(second)

    expect(loadHistory()).toEqual([first, second])
  })
})
