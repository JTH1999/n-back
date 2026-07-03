export const GRID_SIZE = 9
const DEFAULT_MATCH_RATE = 0.3

export type GridPosition = number

export interface SessionConfig {
  n: number
  trialCount: number
  matchRate?: number
}

export type TrialOutcome = 'hit' | 'miss' | 'false-alarm' | 'correct-rejection'

export type SessionStatus = 'active' | 'completed'

export interface SessionState {
  readonly n: number
  readonly sequence: readonly GridPosition[]
  readonly currentTrialIndex: number
  readonly responded: readonly boolean[]
  readonly outcomes: readonly (TrialOutcome | null)[]
  readonly status: SessionStatus
}

function randomPosition(rng: () => number): GridPosition {
  return Math.floor(rng() * GRID_SIZE)
}

// Picks a position, excluding `exclude`, without rejection sampling: pick from
// the GRID_SIZE-1 remaining positions, then shift up past the excluded one.
function randomPositionExcluding(rng: () => number, exclude: GridPosition): GridPosition {
  const position = Math.floor(rng() * (GRID_SIZE - 1))
  return position >= exclude ? position + 1 : position
}

function generateSequence(
  n: number,
  trialCount: number,
  matchRate: number,
  rng: () => number,
): GridPosition[] {
  const sequence: GridPosition[] = []
  for (let i = 0; i < trialCount; i++) {
    if (i >= n && rng() < matchRate) {
      sequence.push(sequence[i - n])
    } else if (i >= n) {
      sequence.push(randomPositionExcluding(rng, sequence[i - n]))
    } else {
      sequence.push(randomPosition(rng))
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

  const matchRate = config.matchRate ?? DEFAULT_MATCH_RATE
  const sequence = generateSequence(config.n, config.trialCount, matchRate, rng)
  return {
    n: config.n,
    sequence,
    currentTrialIndex: 0,
    responded: sequence.map(() => false),
    outcomes: sequence.map(() => null),
    status: 'active',
  }
}

export interface SessionSummary {
  totalTrials: number
  hits: number
  misses: number
  falseAlarms: number
  correctRejections: number
  accuracy: number
}

export function getSummary(state: SessionState): SessionSummary {
  if (state.status !== 'completed') {
    throw new Error('cannot summarize a session that has not completed')
  }

  const totalTrials = state.outcomes.length
  const tally = { hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 }
  const tallyKey: Record<TrialOutcome, keyof typeof tally> = {
    hit: 'hits',
    miss: 'misses',
    'false-alarm': 'falseAlarms',
    'correct-rejection': 'correctRejections',
  }
  for (const outcome of state.outcomes) {
    if (outcome) tally[tallyKey[outcome]]++
  }

  return {
    totalTrials,
    ...tally,
    accuracy: (tally.hits + tally.correctRejections) / totalTrials,
  }
}

export function assertMatch(state: SessionState): SessionState {
  if (state.status !== 'active' || state.responded[state.currentTrialIndex]) {
    return state
  }
  const responded = state.responded.slice()
  responded[state.currentTrialIndex] = true
  return { ...state, responded }
}

export function advance(state: SessionState): SessionState {
  const { currentTrialIndex, sequence, n } = state
  const isMatch =
    currentTrialIndex >= n && sequence[currentTrialIndex] === sequence[currentTrialIndex - n]
  const didRespond = state.responded[currentTrialIndex]
  const outcome: TrialOutcome = isMatch
    ? didRespond
      ? 'hit'
      : 'miss'
    : didRespond
      ? 'false-alarm'
      : 'correct-rejection'

  const outcomes = state.outcomes.slice()
  outcomes[currentTrialIndex] = outcome

  const nextTrialIndex = currentTrialIndex + 1
  return {
    ...state,
    outcomes,
    currentTrialIndex: nextTrialIndex,
    status: nextTrialIndex >= sequence.length ? 'completed' : 'active',
  }
}
