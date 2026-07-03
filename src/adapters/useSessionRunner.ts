import { useCallback, useEffect, useState } from 'react'
import {
  advance,
  assertMatch,
  createSession,
  type SessionConfig,
  type SessionState,
} from '../engine/sessionEngine'

export interface SessionRunnerConfig extends SessionConfig {
  displayDurationMs: number
  trialLengthMs: number
}

export interface SessionRunner {
  state: SessionState
  stimulusVisible: boolean
  assertPositionMatch: () => void
}

export function useSessionRunner(config: SessionRunnerConfig): SessionRunner {
  const [state, setState] = useState<SessionState>(() => createSession(config))
  const [stimulusVisible, setStimulusVisible] = useState(true)

  useEffect(() => {
    if (state.status !== 'active') return

    setStimulusVisible(true)
    const hideStimulus = setTimeout(
      () => setStimulusVisible(false),
      config.displayDurationMs,
    )
    const advanceTrial = setTimeout(() => {
      setState((current) => advance(current))
    }, config.trialLengthMs)

    return () => {
      clearTimeout(hideStimulus)
      clearTimeout(advanceTrial)
    }
  }, [state.currentTrialIndex, state.status, config.displayDurationMs, config.trialLengthMs])

  const assertPositionMatch = useCallback(() => {
    setState((current) => assertMatch(current))
  }, [])

  return { state, stimulusVisible, assertPositionMatch }
}
