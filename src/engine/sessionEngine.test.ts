import { describe, expect, it } from 'vitest'
import {
  advance,
  assertMatch,
  computeRecommendedN,
  createSession,
  getLiveFeedback,
  getSummary,
  type SessionState,
  type StreamsState,
} from './sessionEngine'
import { GRID_SIZE, STREAM_KINDS, STREAM_VALUE_POOLS, type StreamKind } from './streams'

interface StateFixture {
  n: number
  activeStreams: readonly StreamKind[]
  sequences: { [K in StreamKind]?: readonly unknown[] }
  responded?: { [K in StreamKind]?: readonly boolean[] }
}

function buildState({ n, activeStreams, sequences, responded = {} }: StateFixture): SessionState {
  const trialCount = sequences[activeStreams[0]]!.length
  const streams: StreamsState = {}
  for (const kind of activeStreams) {
    const sequence = sequences[kind]!
    Object.assign(streams, {
      [kind]: {
        kind,
        sequence,
        responded: responded[kind] ?? sequence.map(() => false),
        outcomes: sequence.map(() => null),
      },
    })
  }
  return {
    n,
    trialCount,
    activeStreams,
    streams,
    currentTrialIndex: trialCount - 1,
    status: 'active',
  }
}

describe('createSession', () => {
  it('rejects N < 1', () => {
    expect(() => createSession({ n: 0, trialCount: 10, streams: ['position'] })).toThrow(/n/i)
  })

  it('rejects zero trials', () => {
    expect(() => createSession({ n: 1, trialCount: 0, streams: ['position'] })).toThrow(/trial/i)
  })

  it('rejects an empty stream set', () => {
    expect(() => createSession({ n: 1, trialCount: 10, streams: [] })).toThrow(/stream/i)
  })

  it('starts at trial 0 in active status', () => {
    const state = createSession({ n: 2, trialCount: 20, streams: ['position'] })
    expect(state.currentTrialIndex).toBe(0)
    expect(state.status).toBe('active')
  })

  it.each([
    ['position'],
    ['position', 'shape'],
    ['position', 'shape', 'color'],
    ['position', 'shape', 'color', 'letter'],
  ] as const)('generates an independent, correctly-pooled sequence per active stream: %s', (...activeStreams) => {
    const state = createSession({ n: 2, trialCount: 20, streams: activeStreams })

    expect(state.activeStreams).toEqual(activeStreams)
    for (const kind of activeStreams) {
      const streamState = state.streams[kind]!
      expect(streamState.sequence).toHaveLength(20)
      const pool = STREAM_VALUE_POOLS[kind]
      for (const value of streamState.sequence) {
        expect(pool).toContain(value)
      }
    }
  })

  it('only generates active streams, not inactive ones', () => {
    const state = createSession({ n: 2, trialCount: 10, streams: ['shape', 'letter'] })
    expect(state.streams.position).toBeUndefined()
    expect(state.streams.color).toBeUndefined()
    expect(state.streams.shape).toBeDefined()
    expect(state.streams.letter).toBeDefined()
  })

  it('never generates a match before trial index N, even when every trial rolls a match', () => {
    const n = 3
    const trialCount = 200
    const alwaysRollMatch = () => 0
    const state = createSession(
      { n, trialCount, streams: ['position'], matchRate: 1 },
      alwaysRollMatch,
    )
    const sequence = state.streams.position!.sequence

    for (let i = 0; i < n; i++) {
      expect(sequence[i]).toBe(0)
    }
    for (let i = n; i < trialCount; i++) {
      expect(sequence[i]).toBe(sequence[i - n])
    }
  })

  it('matches the configured match rate exactly for every active stream', () => {
    const n = 2
    const trialCount = 5000
    const matchRate = 0.3
    const state = createSession({
      n,
      trialCount,
      streams: ['position', 'shape', 'color', 'letter'],
      matchRate,
    })

    for (const kind of state.activeStreams) {
      const sequence = state.streams[kind]!.sequence
      let matches = 0
      let eligibleTrials = 0
      for (let i = n; i < trialCount; i++) {
        eligibleTrials++
        if (sequence[i] === sequence[i - n]) matches++
      }
      expect(matches).toBe(Math.round(matchRate * eligibleTrials))
    }
  })

  it('produces an exact match count for a small, hand-verified case', () => {
    const n = 1
    const trialCount = 11
    const matchRate = 0.5
    const state = createSession({ n, trialCount, streams: ['position'], matchRate })
    const sequence = state.streams.position!.sequence

    let matches = 0
    for (let i = n; i < trialCount; i++) {
      if (sequence[i] === sequence[i - n]) matches++
    }
    expect(matches).toBe(5)
  })

  it('produces zero matches when matchRate is 0', () => {
    const n = 2
    const trialCount = 50
    const state = createSession({ n, trialCount, streams: ['position'], matchRate: 0 })
    const sequence = state.streams.position!.sequence

    for (let i = n; i < trialCount; i++) {
      expect(sequence[i]).not.toBe(sequence[i - n])
    }
  })

  it('produces all matches when matchRate is 1', () => {
    const n = 2
    const trialCount = 50
    const state = createSession({ n, trialCount, streams: ['position'], matchRate: 1 })
    const sequence = state.streams.position!.sequence

    for (let i = n; i < trialCount; i++) {
      expect(sequence[i]).toBe(sequence[i - n])
    }
  })

  it('generates positions within the grid bounds', () => {
    const state = createSession({ n: 1, trialCount: 50, streams: ['position'] })
    for (const position of state.streams.position!.sequence) {
      expect(position).toBeGreaterThanOrEqual(0)
      expect(position).toBeLessThan(GRID_SIZE)
    }
  })
})

describe('advance', () => {
  const outcomeCases = [
    { name: 'correct-rejection', sequence: [0, 1, 5], responded: [false, false, false], expected: 'correct-rejection' },
    { name: 'miss', sequence: [0, 1, 0], responded: [false, false, false], expected: 'miss' },
    { name: 'hit', sequence: [0, 1, 0], responded: [false, false, true], expected: 'hit' },
    { name: 'false-alarm', sequence: [0, 1, 5], responded: [false, false, true], expected: 'false-alarm' },
  ] as const

  it.each(outcomeCases)('resolves $expected for a single active stream', ({ sequence, responded, expected }) => {
    const state = buildState({
      n: 2,
      activeStreams: ['position'],
      sequences: { position: sequence },
      responded: { position: responded },
    })

    const next = advance(state)

    expect(next.streams.position!.outcomes[2]).toBe(expected)
  })

  it('resolves each active stream independently in the same trial', () => {
    const state = buildState({
      n: 2,
      activeStreams: ['position', 'shape', 'color', 'letter'],
      sequences: {
        position: [0, 1, 0], // matches -> hit or miss depending on response
        shape: ['circle', 'square', 'triangle'], // does not match -> false-alarm or correct-rejection
        color: ['blue', 'orange', 'blue'], // matches
        letter: ['C', 'H', 'K'], // does not match
      },
      responded: {
        position: [false, false, true], // asserted on a match -> hit
        shape: [false, false, true], // asserted on a non-match -> false-alarm
        color: [false, false, false], // not asserted on a match -> miss
        letter: [false, false, false], // not asserted on a non-match -> correct-rejection
      },
    })

    const next = advance(state)

    expect(next.streams.position!.outcomes[2]).toBe('hit')
    expect(next.streams.shape!.outcomes[2]).toBe('false-alarm')
    expect(next.streams.color!.outcomes[2]).toBe('miss')
    expect(next.streams.letter!.outcomes[2]).toBe('correct-rejection')
  })

  function cartesianProduct<T>(arrays: readonly (readonly T[])[]): T[][] {
    return arrays.reduce<T[][]>(
      (acc, curr) => acc.flatMap((combo) => curr.map((item) => [...combo, item])),
      [[]],
    )
  }

  describe.each([1, 2, 3, 4])('every outcome combination across %i active stream(s)', (streamCount) => {
    const kinds = STREAM_KINDS.slice(0, streamCount)
    const combos = cartesianProduct(kinds.map(() => outcomeCases)).map((combo) => ({
      combo,
      label: combo.map((c) => c.name).join(' + '),
    }))

    it.each(combos)('resolves $label', ({ combo }) => {
      const sequences: { [K in StreamKind]?: readonly unknown[] } = {}
      const responded: { [K in StreamKind]?: readonly boolean[] } = {}
      kinds.forEach((kind, i) => {
        sequences[kind] = combo[i].sequence
        responded[kind] = combo[i].responded
      })

      const state = buildState({ n: 2, activeStreams: kinds, sequences, responded })
      const next = advance(state)

      kinds.forEach((kind, i) => {
        expect(next.streams[kind]!.outcomes[2]).toBe(combo[i].expected)
      })
    })
  })

  it('treats trials before N as ineligible for a match, even with identical stimuli', () => {
    const state = buildState({ n: 2, activeStreams: ['position'], sequences: { position: [3, 3] } })
    const stateAtTrial1 = { ...state, currentTrialIndex: 1 }

    expect(advance(stateAtTrial1).streams.position!.outcomes[1]).toBe('correct-rejection')
  })

  it('transitions to completed status after advancing past the last trial', () => {
    const state = buildState({ n: 1, activeStreams: ['position'], sequences: { position: [0, 1] } })

    const next = advance(state)

    expect(next.status).toBe('completed')
    expect(next.currentTrialIndex).toBe(2)
  })

  it('stays active after advancing past a non-final trial', () => {
    const state = buildState({ n: 1, activeStreams: ['position'], sequences: { position: [0, 1, 2] } })
    const stateAtTrial0 = { ...state, currentTrialIndex: 0 }

    expect(advance(stateAtTrial0).status).toBe('active')
  })
})

describe('assertMatch', () => {
  it('records a match assertion for only the asserted stream', () => {
    const state = buildState({
      n: 2,
      activeStreams: ['position', 'shape'],
      sequences: { position: [0, 1, 0], shape: ['circle', 'square', 'circle'] },
    })

    const next = assertMatch(state, 'position')

    expect(next.streams.position!.responded[2]).toBe(true)
    expect(next.streams.shape!.responded[2]).toBe(false)
    expect(advance(next).streams.position!.outcomes[2]).toBe('hit')
  })

  it('does not affect other trials', () => {
    const state = buildState({ n: 2, activeStreams: ['position'], sequences: { position: [0, 1, 0] } })

    const next = assertMatch(state, 'position')

    expect(next.streams.position!.responded[0]).toBe(false)
    expect(next.streams.position!.responded[1]).toBe(false)
  })

  it('is a no-op for a stream kind that is not active', () => {
    const state = buildState({ n: 2, activeStreams: ['position'], sequences: { position: [0, 1, 0] } })

    expect(assertMatch(state, 'shape')).toEqual(state)
  })

  it('is a no-op once the session has completed', () => {
    const state = {
      ...buildState({ n: 2, activeStreams: ['position'], sequences: { position: [0, 1, 0] } }),
      status: 'completed' as const,
    }

    expect(assertMatch(state, 'position')).toEqual(state)
  })
})

describe('getLiveFeedback', () => {
  it('returns no feedback before any trial has resolved', () => {
    const state = buildState({ n: 2, activeStreams: ['position'], sequences: { position: [0, 1, 0] } })
    const stateAtTrial0 = { ...state, currentTrialIndex: 0 }

    expect(getLiveFeedback(stateAtTrial0)).toEqual({})
  })

  it('returns the outcome of the trial that just resolved for each active stream', () => {
    const state = buildState({
      n: 2,
      activeStreams: ['position', 'shape'],
      sequences: { position: [0, 1, 0], shape: ['circle', 'square', 'triangle'] },
      responded: { position: [false, false, true], shape: [false, false, false] },
    })

    const next = advance(state)

    expect(getLiveFeedback(next)).toEqual({ position: 'hit', shape: 'correct-rejection' })
  })

  it('omits streams that have not resolved that trial yet', () => {
    const state = buildState({ n: 2, activeStreams: ['position'], sequences: { position: [0, 1, 0] } })
    const stateAtTrial1 = { ...state, currentTrialIndex: 1 }

    expect(getLiveFeedback(stateAtTrial1)).toEqual({})
  })
})

describe('getSummary', () => {
  it('throws if the session has not completed', () => {
    const state = buildState({ n: 2, activeStreams: ['position'], sequences: { position: [0, 1, 0] } })

    expect(() => getSummary(state)).toThrow(/complete/i)
  })

  it('computes per-stream and overall accuracy across multiple active streams', () => {
    const state: SessionState = {
      n: 2,
      trialCount: 8,
      activeStreams: ['position', 'shape'],
      currentTrialIndex: 8,
      status: 'completed',
      streams: {
        position: {
          kind: 'position',
          sequence: [0, 1, 0, 1, 0, 9, 1, 2],
          responded: [false, false, true, false, false, true, false, false],
          outcomes: [
            'correct-rejection',
            'correct-rejection',
            'hit',
            'miss',
            'correct-rejection',
            'false-alarm',
            'correct-rejection',
            'correct-rejection',
          ],
        },
        shape: {
          kind: 'shape',
          sequence: ['circle', 'square', 'circle', 'square', 'circle', 'triangle', 'square', 'diamond'],
          responded: [false, false, true, false, false, false, false, false],
          outcomes: [
            'correct-rejection',
            'correct-rejection',
            'hit',
            'correct-rejection',
            'correct-rejection',
            'correct-rejection',
            'correct-rejection',
            'correct-rejection',
          ],
        },
      },
    }

    const summary = getSummary(state)

    expect(summary.streams.position).toEqual({
      kind: 'position',
      totalTrials: 8,
      hits: 1,
      misses: 1,
      falseAlarms: 1,
      correctRejections: 5,
      accuracy: 1 / 3,
    })
    expect(summary.streams.shape).toEqual({
      kind: 'shape',
      totalTrials: 8,
      hits: 1,
      misses: 0,
      falseAlarms: 0,
      correctRejections: 7,
      accuracy: 1,
    })
    expect(summary.totalTrials).toBe(16)
    expect(summary.accuracy).toBe(2 / 4)
  })

  it('reports 0 accuracy for a stream with no hits, misses, or false alarms', () => {
    const state: SessionState = {
      n: 2,
      trialCount: 3,
      activeStreams: ['position'],
      currentTrialIndex: 3,
      status: 'completed',
      streams: {
        position: {
          kind: 'position',
          sequence: [0, 1, 5],
          responded: [false, false, false],
          outcomes: ['correct-rejection', 'correct-rejection', 'correct-rejection'],
        },
      },
    }

    const summary = getSummary(state)

    expect(summary.streams.position!.accuracy).toBe(0)
    expect(summary.accuracy).toBe(0)
  })

  it.each([
    ['position'],
    ['position', 'shape'],
    ['position', 'shape', 'color'],
    ['position', 'shape', 'color', 'letter'],
  ] as const)('runs a full session end to end with %s active streams and no off-by-one', (...activeStreams) => {
    const trialCount = 500
    let state = createSession({ n: 2, trialCount, streams: activeStreams })

    for (let i = 0; i < trialCount; i++) {
      expect(state.status).toBe('active')
      if (i % 3 === 0) {
        for (const kind of activeStreams) state = assertMatch(state, kind)
      }
      state = advance(state)
    }

    expect(state.status).toBe('completed')
    expect(state.currentTrialIndex).toBe(trialCount)

    const summary = getSummary(state)
    expect(summary.totalTrials).toBe(trialCount * activeStreams.length)
    for (const kind of activeStreams) {
      const streamSummary = summary.streams[kind]!
      expect(
        streamSummary.hits + streamSummary.misses + streamSummary.falseAlarms + streamSummary.correctRejections,
      ).toBe(trialCount)
    }
  })
})

describe('computeRecommendedN', () => {
  const thresholds = { lowerThreshold: 0.5, upperThreshold: 0.8 }

  it('increases N when accuracy exceeds the upper threshold', () => {
    expect(computeRecommendedN(3, 0.81, thresholds)).toBe(4)
  })

  it('decreases N when accuracy is below the lower threshold', () => {
    expect(computeRecommendedN(3, 0.49, thresholds)).toBe(2)
  })

  it('leaves N unchanged at the upper threshold boundary', () => {
    expect(computeRecommendedN(3, 0.8, thresholds)).toBe(3)
  })

  it('leaves N unchanged at the lower threshold boundary', () => {
    expect(computeRecommendedN(3, 0.5, thresholds)).toBe(3)
  })

  it('leaves N unchanged inside the band', () => {
    expect(computeRecommendedN(3, 0.65, thresholds)).toBe(3)
  })

  it('never decreases N below 1', () => {
    expect(computeRecommendedN(1, 0, thresholds)).toBe(1)
  })
})
