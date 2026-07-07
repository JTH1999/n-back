import { useCallback, useEffect, useState } from 'react'
import {
  advance,
  assertMatch,
  createSession,
  type SessionConfig,
  type SessionState,
} from '../engine/sessionEngine'
import type { StreamKind } from '../engine/streams'
import { playLetter } from '../audio/letterAudio'

export interface SessionRunnerConfig extends SessionConfig {
  displayDurationMs: number
  trialLengthMs: number
  volume: number
  muted: boolean
}

export interface SessionRunner {
  state: SessionState
  stimulusVisible: boolean
  assertStreamMatch: (kind: StreamKind) => void
}

export function useSessionRunner(config: SessionRunnerConfig): SessionRunner {
  const [state, setState] = useState<SessionState>(() => createSession(config))
  const [stimulusVisible, setStimulusVisible] = useState(true)
  const currentLetter = state.streams.letter?.sequence[state.currentTrialIndex] ?? null

  useEffect(() => {
    if (state.status !== 'active' || !currentLetter) return
    playLetter(currentLetter, config.volume, config.muted)
  }, [state.currentTrialIndex, state.status, currentLetter, config.volume, config.muted])

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
  }, [
    state.currentTrialIndex,
    state.status,
    config.displayDurationMs,
    config.trialLengthMs,
  ])

  const assertStreamMatch = useCallback((kind: StreamKind) => {
    setState((current) => assertMatch(current, kind))
  }, [])

  return { state, stimulusVisible, assertStreamMatch }
}
