import { useCallback, useEffect, useRef, useState } from 'react'
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
  paused: boolean
  assertStreamMatch: (kind: StreamKind) => void
  pause: () => void
  resume: () => void
  restart: () => void
}

// Between trials, once a trial resolves. Feedback occupies this whole gap, and
// no stimulus is shown, so it never overlaps the next trial's question.
type Phase = 'trial' | 'feedback'

// A quick flash, deliberately shorter than the stimulus display duration —
// long enough to register, brief enough not to slow down the session.
export const FEEDBACK_FLASH_MS = 500

function consumeElapsed(remainingRef: { current: number }, start: number): void {
  remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - start))
}

export function useSessionRunner(config: SessionRunnerConfig): SessionRunner {
  const [state, setState] = useState<SessionState>(() => createSession(config))
  const [stimulusVisible, setStimulusVisible] = useState(true)
  const [phase, setPhase] = useState<Phase>('trial')
  const [paused, setPaused] = useState(false)
  const currentLetter = state.streams.letter?.sequence[state.currentTrialIndex] ?? null

  // Time remaining on each timer, so pausing and resuming picks up exactly
  // where it left off instead of restarting the full duration.
  const hideRemainingRef = useRef(config.displayDurationMs)
  const endRemainingRef = useRef(config.trialLengthMs)
  const feedbackRemainingRef = useRef(FEEDBACK_FLASH_MS)

  useEffect(() => {
    if (state.status !== 'active' || !currentLetter) return
    playLetter(currentLetter, config.volume, config.muted)
  }, [state.currentTrialIndex, state.status, currentLetter, config.volume, config.muted])

  useEffect(() => {
    hideRemainingRef.current = config.displayDurationMs
    endRemainingRef.current = config.trialLengthMs
  }, [state.currentTrialIndex, config.displayDurationMs, config.trialLengthMs])

  useEffect(() => {
    if (state.status !== 'active' || phase !== 'trial' || paused) return

    setStimulusVisible(hideRemainingRef.current > 0)

    const hideDelay = hideRemainingRef.current
    const hideStimulus =
      hideDelay > 0 ? setTimeout(() => setStimulusVisible(false), hideDelay) : null
    const start = Date.now()
    const endTrial = setTimeout(() => {
      setState((current) => advance(current))
      if (config.liveFeedback) setPhase('feedback')
    }, endRemainingRef.current)

    return () => {
      if (hideStimulus) clearTimeout(hideStimulus)
      clearTimeout(endTrial)
      consumeElapsed(hideRemainingRef, start)
      consumeElapsed(endRemainingRef, start)
    }
  }, [state.currentTrialIndex, state.status, phase, paused, config.liveFeedback])

  useEffect(() => {
    if (phase === 'feedback') feedbackRemainingRef.current = FEEDBACK_FLASH_MS
  }, [phase])

  useEffect(() => {
    if (phase !== 'feedback' || paused) return
    const start = Date.now()
    const endFeedback = setTimeout(() => setPhase('trial'), feedbackRemainingRef.current)
    return () => {
      clearTimeout(endFeedback)
      consumeElapsed(feedbackRemainingRef, start)
    }
  }, [phase, paused])

  const pause = useCallback(() => setPaused(true), [])
  const resume = useCallback(() => setPaused(false), [])
  const restart = useCallback(() => {
    setState(createSession(config))
    setPhase('trial')
    setPaused(false)
  }, [config])

  const acceptingInput = state.status === 'active' && phase === 'trial' && !paused

  const assertStreamMatch = useCallback(
    (kind: StreamKind) => {
      if (!acceptingInput) return
      setState((current) => assertMatch(current, kind))
    },
    [acceptingInput],
  )

  const feedback = phase === 'feedback' ? getLiveFeedback(state) : {}
  const readyForSummary = state.status === 'completed' && (!config.liveFeedback || phase !== 'feedback')

  return {
    state,
    stimulusVisible,
    feedback,
    readyForSummary,
    acceptingInput,
    paused,
    assertStreamMatch,
    pause,
    resume,
    restart,
  }
}
