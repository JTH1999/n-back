import { describe, expect, it } from 'vitest'
import {
  advance,
  assertMatch,
  createSession,
  getSummary,
  type SessionState,
} from './sessionEngine'

describe('createSession', () => {
  it('rejects N < 1', () => {
    expect(() => createSession({ n: 0, trialCount: 10 })).toThrow(/n/i)
  })

  it('rejects zero trials', () => {
    expect(() => createSession({ n: 1, trialCount: 0 })).toThrow(/trial/i)
  })

  it('generates a sequence of grid positions (0-8) with one stimulus per trial', () => {
    const state = createSession({ n: 2, trialCount: 20 })
    expect(state.sequence).toHaveLength(20)
    for (const position of state.sequence) {
      expect(position).toBeGreaterThanOrEqual(0)
      expect(position).toBeLessThanOrEqual(8)
    }
  })

  it('starts at trial 0 in active status', () => {
    const state = createSession({ n: 2, trialCount: 20 })
    expect(state.currentTrialIndex).toBe(0)
    expect(state.status).toBe('active')
  })

  it('never generates a match before trial index N, even when every trial rolls a match', () => {
    const n = 3
    const trialCount = 200
    const alwaysRollMatch = () => 0 // rng() < matchRate is always true
    const state = createSession({ n, trialCount, matchRate: 1 }, alwaysRollMatch)

    for (let i = 0; i < n; i++) {
      // No trial N-back exists yet: the rng's match roll is never consulted here,
      // so the deterministic rng (always 0) falls through to plain position 0.
      expect(state.sequence[i]).toBe(0)
    }
    for (let i = n; i < trialCount; i++) {
      expect(state.sequence[i]).toBe(state.sequence[i - n])
    }
  })

  it('approximates the configured match rate over a large sample', () => {
    const n = 2
    const trialCount = 5000
    const matchRate = 0.3
    const state = createSession({ n, trialCount, matchRate })

    let matches = 0
    let eligibleTrials = 0
    for (let i = n; i < trialCount; i++) {
      eligibleTrials++
      if (state.sequence[i] === state.sequence[i - n]) matches++
    }

    const observedRate = matches / eligibleTrials
    expect(observedRate).toBeGreaterThan(matchRate - 0.05)
    expect(observedRate).toBeLessThan(matchRate + 0.05)
  })
})

describe('advance', () => {
  it('resolves the current trial to correct-rejection when there is no match and no assertion', () => {
    const state: SessionState = {
      n: 2,
      sequence: [0, 1, 5], // trial 2 (value 5) does not match trial 0 (value 0)
      currentTrialIndex: 2,
      responded: [false, false, false],
      outcomes: [null, null, null],
      status: 'active',
    }

    const next = advance(state)

    expect(next.outcomes[2]).toBe('correct-rejection')
  })

  it('resolves miss when the trial matches but was not asserted', () => {
    const state: SessionState = {
      n: 2,
      sequence: [0, 1, 0],
      currentTrialIndex: 2,
      responded: [false, false, false],
      outcomes: [null, null, null],
      status: 'active',
    }

    expect(advance(state).outcomes[2]).toBe('miss')
  })

  it('resolves hit when the trial matches and was asserted', () => {
    const state: SessionState = {
      n: 2,
      sequence: [0, 1, 0],
      currentTrialIndex: 2,
      responded: [false, false, true],
      outcomes: [null, null, null],
      status: 'active',
    }

    expect(advance(state).outcomes[2]).toBe('hit')
  })

  it('resolves false-alarm when the trial does not match but was asserted', () => {
    const state: SessionState = {
      n: 2,
      sequence: [0, 1, 5],
      currentTrialIndex: 2,
      responded: [false, false, true],
      outcomes: [null, null, null],
      status: 'active',
    }

    expect(advance(state).outcomes[2]).toBe('false-alarm')
  })

  it('treats trials before N as ineligible for a match, even with identical stimuli', () => {
    const state: SessionState = {
      n: 2,
      sequence: [3, 3],
      currentTrialIndex: 1,
      responded: [false, false],
      outcomes: [null, null],
      status: 'active',
    }

    expect(advance(state).outcomes[1]).toBe('correct-rejection')
  })

  it('transitions to completed status after advancing past the last trial', () => {
    const state: SessionState = {
      n: 1,
      sequence: [0, 1],
      currentTrialIndex: 1,
      responded: [false, false],
      outcomes: [null, null],
      status: 'active',
    }

    const next = advance(state)

    expect(next.status).toBe('completed')
    expect(next.currentTrialIndex).toBe(2)
  })

  it('stays active after advancing past a non-final trial', () => {
    const state: SessionState = {
      n: 1,
      sequence: [0, 1, 2],
      currentTrialIndex: 0,
      responded: [false, false, false],
      outcomes: [null, null, null],
      status: 'active',
    }

    expect(advance(state).status).toBe('active')
  })
})

describe('assertMatch', () => {
  it('records a match assertion for the current trial', () => {
    const state: SessionState = {
      n: 2,
      sequence: [0, 1, 0],
      currentTrialIndex: 2,
      responded: [false, false, false],
      outcomes: [null, null, null],
      status: 'active',
    }

    const next = assertMatch(state)

    expect(next.responded[2]).toBe(true)
    expect(advance(next).outcomes[2]).toBe('hit')
  })

  it('does not affect other trials', () => {
    const state: SessionState = {
      n: 2,
      sequence: [0, 1, 0],
      currentTrialIndex: 2,
      responded: [false, false, false],
      outcomes: [null, null, null],
      status: 'active',
    }

    const next = assertMatch(state)

    expect(next.responded[0]).toBe(false)
    expect(next.responded[1]).toBe(false)
  })

  it('is a no-op once the session has completed', () => {
    const state: SessionState = {
      n: 2,
      sequence: [0, 1, 0],
      currentTrialIndex: 3,
      responded: [false, false, false],
      outcomes: ['correct-rejection', 'correct-rejection', 'miss'],
      status: 'completed',
    }

    expect(assertMatch(state)).toEqual(state)
  })
})

describe('getSummary', () => {
  it('throws if the session has not completed', () => {
    const state: SessionState = {
      n: 2,
      sequence: [0, 1, 0],
      currentTrialIndex: 2,
      responded: [false, false, false],
      outcomes: [null, null, null],
      status: 'active',
    }

    expect(() => getSummary(state)).toThrow(/complete/i)
  })

  it('computes overall accuracy from the resolved outcomes', () => {
    const state: SessionState = {
      n: 2,
      sequence: [0, 1, 0, 1, 0, 9, 1, 2],
      currentTrialIndex: 8,
      responded: [false, false, true, false, false, true, false, false],
      outcomes: ['correct-rejection', 'correct-rejection', 'hit', 'miss', 'correct-rejection', 'false-alarm', 'correct-rejection', 'correct-rejection'],
      status: 'completed',
    }

    const summary = getSummary(state)

    expect(summary).toEqual({
      totalTrials: 8,
      hits: 1,
      misses: 1,
      falseAlarms: 1,
      correctRejections: 5,
      accuracy: 6 / 8,
    })
  })

  it('runs a full session end to end with N=1 and a large trial count with no off-by-one', () => {
    const trialCount = 1000
    let state = createSession({ n: 1, trialCount })

    for (let i = 0; i < trialCount; i++) {
      expect(state.status).toBe('active')
      state = advance(state)
    }

    expect(state.status).toBe('completed')
    expect(state.currentTrialIndex).toBe(trialCount)
    const summary = getSummary(state)
    expect(summary.totalTrials).toBe(trialCount)
    expect(summary.hits + summary.misses + summary.falseAlarms + summary.correctRejections).toBe(
      trialCount,
    )
  })
})
