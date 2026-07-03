import { useEffect } from 'react'
import {
  useSessionRunner,
  type SessionRunnerConfig,
} from '../adapters/useSessionRunner'
import { getSummary, type SessionState } from '../engine/sessionEngine'
import { GRID_SIZE } from '../engine/streams'
import { STREAM_KEYMAP } from '../config/keymap'
import { Grid, type StimulusDisplay } from './Grid'
import { SessionSummary } from './SessionSummary'

const CENTER_CELL = Math.floor(GRID_SIZE / 2)

export interface SessionRunnerProps {
  config: SessionRunnerConfig
  onRestart: () => void
}

function buildStimulusDisplay(state: SessionState, stimulusVisible: boolean): StimulusDisplay | null {
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

export function SessionRunner({ config, onRestart }: SessionRunnerProps) {
  const { state, stimulusVisible, assertStreamMatch } = useSessionRunner(config)

  useEffect(() => {
    if (state.status !== 'active') return

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const kind = state.activeStreams.find((streamKind) => STREAM_KEYMAP[streamKind] === key)
      if (kind) assertStreamMatch(kind)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.status, state.activeStreams, assertStreamMatch])

  if (state.status === 'completed') {
    return <SessionSummary summary={getSummary(state)} onRestart={onRestart} />
  }

  const stimulus = buildStimulusDisplay(state, stimulusVisible)

  return (
    <div className="flex flex-col items-center gap-4">
      <p>
        Trial {state.currentTrialIndex + 1} of {state.trialCount}
      </p>
      <Grid stimulus={stimulus} />
      <ul className="flex flex-col items-center gap-1 text-sm text-slate-500">
        {state.activeStreams.map((kind) => (
          <li key={kind} className="capitalize">
            Press <kbd>{STREAM_KEYMAP[kind].toUpperCase()}</kbd> when {kind} matches {config.n}{' '}
            trial(s) back
          </li>
        ))}
      </ul>
    </div>
  )
}
