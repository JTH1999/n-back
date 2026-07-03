import { useEffect } from 'react'
import {
  useSessionRunner,
  type SessionRunnerConfig,
} from '../adapters/useSessionRunner'
import { getSummary } from '../engine/sessionEngine'
import { Grid } from './Grid'
import { SessionSummary } from './SessionSummary'

const POSITION_MATCH_KEY = 'a'

export interface SessionRunnerProps {
  config: SessionRunnerConfig
  onRestart: () => void
}

export function SessionRunner({ config, onRestart }: SessionRunnerProps) {
  const { state, stimulusVisible, assertPositionMatch } = useSessionRunner(config)

  useEffect(() => {
    if (state.status !== 'active') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === POSITION_MATCH_KEY) {
        assertPositionMatch()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state.status, assertPositionMatch])

  if (state.status === 'completed') {
    return <SessionSummary summary={getSummary(state)} onRestart={onRestart} />
  }

  const activeCell = stimulusVisible ? state.sequence[state.currentTrialIndex] : null

  return (
    <div className="flex flex-col items-center gap-4">
      <p>
        Trial {state.currentTrialIndex + 1} of {state.sequence.length}
      </p>
      <Grid activeCell={activeCell} />
      <p className="text-sm text-slate-500">
        Press <kbd>{POSITION_MATCH_KEY.toUpperCase()}</kbd> when the position matches{' '}
        {config.n} trial(s) back
      </p>
    </div>
  )
}
