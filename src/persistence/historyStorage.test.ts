import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionRunnerConfig } from '../hooks/useSessionRunner'
import type { SessionSummary } from '../engine/sessionEngine'
import { appendHistoryRecord, loadHistory, replaceHistory } from './historyStorage'

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
    const record = { id: 'record-1', timestamp: '2026-07-08T12:00:00.000Z', config, summary }

    appendHistoryRecord(record)

    expect(loadHistory()).toEqual([record])
  })

  it('preserves existing records when appending a new one', () => {
    const first = { id: 'record-1', timestamp: '2026-07-08T12:00:00.000Z', config, summary }
    const second = { id: 'record-2', timestamp: '2026-07-08T12:05:00.000Z', config, summary }

    appendHistoryRecord(first)
    appendHistoryRecord(second)

    expect(loadHistory()).toEqual([first, second])
  })
})

describe('replaceHistory', () => {
  it('overwrites any existing history', () => {
    const first = { id: 'record-1', timestamp: '2026-07-08T12:00:00.000Z', config, summary }
    appendHistoryRecord(first)

    const second = { id: 'record-2', timestamp: '2026-07-08T12:05:00.000Z', config, summary }
    replaceHistory([second])

    expect(loadHistory()).toEqual([second])
  })

  it('can clear history by replacing it with an empty array', () => {
    appendHistoryRecord({ id: 'record-1', timestamp: '2026-07-08T12:00:00.000Z', config, summary })

    replaceHistory([])

    expect(loadHistory()).toEqual([])
  })
})

describe('loadHistory id backfill', () => {
  it('assigns an id to a legacy record that was persisted before ids existed', () => {
    window.localStorage.setItem(
      'n-back:session-history',
      JSON.stringify([{ timestamp: '2026-07-08T12:00:00.000Z', config, summary }]),
    )

    const history = loadHistory()

    expect(history).toHaveLength(1)
    expect(history[0].id).toEqual(expect.any(String))
  })

  it('persists the backfilled id so it stays stable across loads', () => {
    window.localStorage.setItem(
      'n-back:session-history',
      JSON.stringify([{ timestamp: '2026-07-08T12:00:00.000Z', config, summary }]),
    )

    const first = loadHistory()
    const second = loadHistory()

    expect(second[0].id).toBe(first[0].id)
  })

  it('leaves an existing id untouched', () => {
    window.localStorage.setItem(
      'n-back:session-history',
      JSON.stringify([{ id: 'record-1', timestamp: '2026-07-08T12:00:00.000Z', config, summary }]),
    )

    expect(loadHistory()[0].id).toBe('record-1')
  })
})
