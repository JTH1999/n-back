import { useEffect } from 'react'
import {
  useSessionRunner,
  type SessionRunnerConfig,
} from '../adapters/useSessionRunner'
import { getStimulusDisplay, getSummary } from '../engine/sessionEngine'
import { STREAM_KEYMAP } from '../config/keymap'
import { Grid } from './Grid'
import { SessionSummary } from './SessionSummary'
import { StreamButtons } from './StreamButtons'

export interface SessionRunnerProps {
  config: SessionRunnerConfig
  onRestart: () => void
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

  const stimulus = getStimulusDisplay(state, stimulusVisible)

  return (
    <>
      <div className="flex flex-col items-center gap-4 pb-24">
        <p>
          Trial {state.currentTrialIndex + 1} of {state.trialCount}
        </p>
        <Grid stimulus={stimulus} />
        <ul className="flex flex-col items-center gap-1 text-sm text-slate-500">
          {state.activeStreams.map((kind) => (
            <li key={kind} className="capitalize">
              Press <kbd>{STREAM_KEYMAP[kind].toUpperCase()}</kbd> or tap the button below when{' '}
              {kind} matches {config.n} trial(s) back
            </li>
          ))}
        </ul>
      </div>
      <StreamButtons activeStreams={state.activeStreams} onAssert={assertStreamMatch} />
    </>
  )
}
