import {
  CENTER_CELL,
  STREAM_VALUE_POOLS,
  type StimulusDisplay,
  type StreamKind,
  type StreamValueMap,
} from './streams'

export const DEFAULT_MATCH_RATE = 0.3

export interface SessionConfig {
  n: number
  trialCount: number
  streams: readonly StreamKind[]
  matchRate?: number
}

export type TrialOutcome = 'hit' | 'miss' | 'false-alarm' | 'correct-rejection'

export type SessionStatus = 'active' | 'completed'

export interface StreamState<K extends StreamKind = StreamKind> {
  readonly kind: K
  readonly sequence: readonly StreamValueMap[K][]
  readonly responded: readonly boolean[]
  readonly outcomes: readonly (TrialOutcome | null)[]
}

export type StreamsState = { [K in StreamKind]?: StreamState<K> }

export interface SessionState {
  readonly n: number
  readonly trialCount: number
  readonly activeStreams: readonly StreamKind[]
  readonly streams: StreamsState
  readonly currentTrialIndex: number
  readonly status: SessionStatus
}

function buildStreamsRecord<R>(
  activeStreams: readonly StreamKind[],
  fn: (kind: StreamKind) => R | undefined,
): Partial<Record<StreamKind, R>> {
  const result: Partial<Record<StreamKind, R>> = {}
  for (const kind of activeStreams) {
    const value = fn(kind)
    if (value !== undefined) result[kind] = value
  }
  return result
}

function randomValue<T>(rng: () => number, pool: readonly T[]): T {
  return pool[Math.floor(rng() * pool.length)]
}

// Picks a value, excluding `exclude`, without rejection sampling: pick from
// the pool.length-1 remaining values, then shift up past the excluded one.
function randomValueExcluding<T>(rng: () => number, pool: readonly T[], exclude: T): T {
  const excludeIndex = pool.indexOf(exclude)
  const index = Math.floor(rng() * (pool.length - 1))
  return pool[index >= excludeIndex ? index + 1 : index]
}

function generateStreamSequence<K extends StreamKind>(
  kind: K,
  n: number,
  trialCount: number,
  matchRate: number,
  rng: () => number,
): StreamValueMap[K][] {
  const pool = STREAM_VALUE_POOLS[kind]
  const sequence: StreamValueMap[K][] = []
  for (let i = 0; i < trialCount; i++) {
    if (i >= n && rng() < matchRate) {
      sequence.push(sequence[i - n])
    } else if (i >= n) {
      sequence.push(randomValueExcluding(rng, pool, sequence[i - n]))
    } else {
      sequence.push(randomValue(rng, pool))
    }
  }
  return sequence
}

export function createSession(
  config: SessionConfig,
  rng: () => number = Math.random,
): SessionState {
  if (config.n < 1) {
    throw new Error(`n must be >= 1, got ${config.n}`)
  }
  if (config.trialCount < 1) {
    throw new Error(`trialCount must be >= 1, got ${config.trialCount}`)
  }
  if (config.streams.length < 1) {
    throw new Error('at least one stream must be active')
  }

  const matchRate = config.matchRate ?? DEFAULT_MATCH_RATE
  const streams = buildStreamsRecord(config.streams, (kind) => {
    const sequence = generateStreamSequence(kind, config.n, config.trialCount, matchRate, rng)
    return {
      kind,
      sequence,
      responded: sequence.map(() => false),
      outcomes: sequence.map(() => null),
    }
  })

  return {
    n: config.n,
    trialCount: config.trialCount,
    activeStreams: config.streams,
    streams: streams as StreamsState,
    currentTrialIndex: 0,
    status: 'active',
  }
}

export function assertMatch(state: SessionState, kind: StreamKind): SessionState {
  const streamState = state.streams[kind]
  if (state.status !== 'active' || !streamState || streamState.responded[state.currentTrialIndex]) {
    return state
  }
  const responded = streamState.responded.slice()
  responded[state.currentTrialIndex] = true
  return {
    ...state,
    streams: { ...state.streams, [kind]: { ...streamState, responded } },
  }
}

export function getStimulusDisplay(
  state: SessionState,
  stimulusVisible: boolean,
): StimulusDisplay | null {
  if (!stimulusVisible) return null
  const { position, shape, color } = state.streams
  if (!position && !shape && !color) return null

  const index = state.currentTrialIndex
  return {
    cell: position ? position.sequence[index] : CENTER_CELL,
    shape: shape ? shape.sequence[index] : null,
    color: color ? color.sequence[index] : null,
  }
}

export function getLiveFeedback(state: SessionState): Partial<Record<StreamKind, TrialOutcome>> {
  const resolvedTrialIndex = state.currentTrialIndex - 1
  if (resolvedTrialIndex < 0) return {}

  return buildStreamsRecord(
    state.activeStreams,
    (kind) => state.streams[kind]?.outcomes[resolvedTrialIndex] ?? undefined,
  )
}

export function advance(state: SessionState): SessionState {
  const { currentTrialIndex, n } = state
  const streams = buildStreamsRecord(state.activeStreams, (kind) => {
    const streamState = state.streams[kind]
    if (!streamState) return undefined

    const isMatch =
      currentTrialIndex >= n &&
      streamState.sequence[currentTrialIndex] === streamState.sequence[currentTrialIndex - n]
    const didRespond = streamState.responded[currentTrialIndex]
    const outcome: TrialOutcome = isMatch
      ? didRespond
        ? 'hit'
        : 'miss'
      : didRespond
        ? 'false-alarm'
        : 'correct-rejection'

    const outcomes = streamState.outcomes.slice()
    outcomes[currentTrialIndex] = outcome
    return { ...streamState, outcomes }
  })

  const nextTrialIndex = currentTrialIndex + 1
  return {
    ...state,
    streams: streams as StreamsState,
    currentTrialIndex: nextTrialIndex,
    status: nextTrialIndex >= state.trialCount ? 'completed' : 'active',
  }
}

export interface AdaptiveThresholds {
  lowerThreshold: number
  upperThreshold: number
}

// Boundary accuracy values fall inside the "unchanged" band, so only accuracy
// strictly beyond a threshold triggers a change.
export function computeRecommendedN(
  currentN: number,
  accuracy: number,
  thresholds: AdaptiveThresholds,
): number {
  if (accuracy > thresholds.upperThreshold) return currentN + 1
  if (accuracy < thresholds.lowerThreshold) return Math.max(1, currentN - 1)
  return currentN
}

export interface StreamSummary {
  kind: StreamKind
  totalTrials: number
  hits: number
  misses: number
  falseAlarms: number
  correctRejections: number
  accuracy: number
}

export interface SessionSummary {
  totalTrials: number
  accuracy: number
  streams: Partial<Record<StreamKind, StreamSummary>>
}

// Accuracy only rewards catching real matches; correct rejections don't count,
// and false alarms dilute the score by counting as a missed opportunity to hit.
function computeAccuracy(hits: number, misses: number, falseAlarms: number): number {
  const opportunities = hits + misses + falseAlarms
  return opportunities === 0 ? 0 : hits / opportunities
}

function summarizeStream(streamState: StreamState): StreamSummary {
  const tally = { hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 }
  const tallyKey: Record<TrialOutcome, keyof typeof tally> = {
    hit: 'hits',
    miss: 'misses',
    'false-alarm': 'falseAlarms',
    'correct-rejection': 'correctRejections',
  }
  for (const outcome of streamState.outcomes) {
    if (outcome) tally[tallyKey[outcome]]++
  }
  const totalTrials = streamState.outcomes.length
  return {
    kind: streamState.kind,
    totalTrials,
    ...tally,
    accuracy: computeAccuracy(tally.hits, tally.misses, tally.falseAlarms),
  }
}

export function getSummary(state: SessionState): SessionSummary {
  if (state.status !== 'completed') {
    throw new Error('cannot summarize a session that has not completed')
  }

  let hits = 0
  let misses = 0
  let falseAlarms = 0
  let totalTrials = 0
  const streams = buildStreamsRecord(state.activeStreams, (kind) => {
    const streamState = state.streams[kind]
    if (!streamState) return undefined
    const summary = summarizeStream(streamState)
    hits += summary.hits
    misses += summary.misses
    falseAlarms += summary.falseAlarms
    totalTrials += summary.totalTrials
    return summary
  })

  return {
    totalTrials,
    accuracy: computeAccuracy(hits, misses, falseAlarms),
    streams,
  }
}
