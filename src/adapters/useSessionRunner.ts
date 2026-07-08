import { useCallback, useEffect, useState } from 'react'
import {
  advance,
  assertMatch,
  createSession,
  getLiveFeedback,
  type SessionConfig,
  type SessionState,
  type TrialOutcome,
} from '../engine/sessionEngine'
import type { StreamKind } from '../engine/streams'
import { playLetter } from '../audio/letterAudio'

export interface SessionRunnerConfig extends SessionConfig {
  displayDurationMs: number
  trialLengthMs: number
  volume: number
  muted: boolean
  liveFeedback: boolean
}

export interface SessionRunner {
  state: SessionState
  stimulusVisible: boolean
  feedback: Partial<Record<StreamKind, TrialOutcome>>
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

  const [feedbackVisible, setFeedbackVisible] = useState(false)

  useEffect(() => {
    if (!config.liveFeedback || state.currentTrialIndex === 0) return

    setFeedbackVisible(true)
    const hideFeedback = setTimeout(() => setFeedbackVisible(false), config.displayDurationMs)
    return () => clearTimeout(hideFeedback)
  }, [state.currentTrialIndex, config.liveFeedback, config.displayDurationMs])

  const feedback = feedbackVisible ? getLiveFeedback(state) : {}

  return { state, stimulusVisible, feedback, assertStreamMatch }
}
