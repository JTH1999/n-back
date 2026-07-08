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

export interface AdaptiveConfig {
  enabled: boolean
  lowerThreshold: number
  upperThreshold: number
}

export interface SessionRunnerConfig extends SessionConfig {
  displayDurationMs: number
  trialLengthMs: number
  volume: number
  muted: boolean
  liveFeedback: boolean
  adaptive: AdaptiveConfig
}

export interface SessionRunner {
  state: SessionState
  stimulusVisible: boolean
  feedback: Partial<Record<StreamKind, TrialOutcome>>
  readyForSummary: boolean
  acceptingInput: boolean
  assertStreamMatch: (kind: StreamKind) => void
}

// Between trials, once a trial resolves. Feedback occupies this whole gap, and
// no stimulus is shown, so it never overlaps the next trial's question.
type Phase = 'trial' | 'feedback'

// A quick flash, deliberately shorter than the stimulus display duration —
// long enough to register, brief enough not to slow down the session.
export const FEEDBACK_FLASH_MS = 500

export function useSessionRunner(config: SessionRunnerConfig): SessionRunner {
  const [state, setState] = useState<SessionState>(() => createSession(config))
  const [stimulusVisible, setStimulusVisible] = useState(true)
  const [phase, setPhase] = useState<Phase>('trial')
  const currentLetter = state.streams.letter?.sequence[state.currentTrialIndex] ?? null

  useEffect(() => {
    if (state.status !== 'active' || !currentLetter) return
    playLetter(currentLetter, config.volume, config.muted)
  }, [state.currentTrialIndex, state.status, currentLetter, config.volume, config.muted])

  useEffect(() => {
    if (state.status !== 'active' || phase !== 'trial') return

    setStimulusVisible(true)

    const hideStimulus = setTimeout(
      () => setStimulusVisible(false),
      config.displayDurationMs,
    )
    const endTrial = setTimeout(() => {
      setState((current) => advance(current))
      if (config.liveFeedback) setPhase('feedback')
    }, config.trialLengthMs)

    return () => {
      clearTimeout(hideStimulus)
      clearTimeout(endTrial)
    }
  }, [
    state.currentTrialIndex,
    state.status,
    phase,
    config.displayDurationMs,
    config.trialLengthMs,
    config.liveFeedback,
  ])

  useEffect(() => {
    if (phase !== 'feedback') return
    const endFeedback = setTimeout(() => setPhase('trial'), FEEDBACK_FLASH_MS)
    return () => clearTimeout(endFeedback)
  }, [phase])

  const acceptingInput = state.status === 'active' && phase === 'trial'

  const assertStreamMatch = useCallback(
    (kind: StreamKind) => {
      if (!acceptingInput) return
      setState((current) => assertMatch(current, kind))
    },
    [acceptingInput],
  )

  const feedback = phase === 'feedback' ? getLiveFeedback(state) : {}
  const readyForSummary = state.status === 'completed' && (!config.liveFeedback || phase !== 'feedback')

  return { state, stimulusVisible, feedback, readyForSummary, acceptingInput, assertStreamMatch }
}
