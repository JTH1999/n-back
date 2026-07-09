import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  useSessionRunner,
  type SessionRunnerConfig,
} from '../adapters/useSessionRunner'
import { computeRecommendedN, getStimulusDisplay, getSummary } from '../engine/sessionEngine'
import type { Keymap } from '../config/keymap'
import type { StreamKind } from '../engine/streams'
import { appendHistoryRecord } from '../persistence/historyStorage'
import { saveDraftSettings } from '../persistence/settingsStorage'
import { BORDERED_CONTROL_CLASS } from '../styles/controls'
import { MAX_N } from './ConfigForm'
import { Grid } from './Grid'
import { SessionSummary } from './SessionSummary'
import { StreamButtons } from './StreamButtons'

export interface SessionRunnerProps {
  config: SessionRunnerConfig
  keymap: Keymap
  onRestart: () => void
  confirmAbort?: (message: string) => boolean
}

const ABORT_CONFIRM_MESSAGE = 'Abort this session? Your progress will not be saved.'

const CONTROL_BUTTON_CLASS = clsx(BORDERED_CONTROL_CLASS, 'px-3 py-1 text-sm')

export function SessionRunner({
  config,
  keymap,
  onRestart,
  confirmAbort = (message) => window.confirm(message),
}: SessionRunnerProps) {
  const {
    state,
    stimulusVisible,
    feedback,
    readyForSummary,
    acceptingInput,
    paused,
    assertStreamMatch,
    pause,
    resume,
  } = useSessionRunner(config)
  const [pressedStreams, setPressedStreams] = useState<ReadonlySet<StreamKind>>(new Set())
  const hasRecordedHistory = useRef(false)
  const hasAppliedAdaptiveN = useRef(false)
  const summary = useMemo(() => (readyForSummary ? getSummary(state) : null), [readyForSummary, state])

  useEffect(() => {
    setPressedStreams(new Set())
  }, [state.currentTrialIndex])

  useEffect(() => {
    if (!summary || hasRecordedHistory.current) return
    hasRecordedHistory.current = true
    appendHistoryRecord({ timestamp: new Date().toISOString(), config, summary })
  }, [summary, config])

  useEffect(() => {
    if (!summary || hasAppliedAdaptiveN.current || !config.adaptive.enabled) return
    hasAppliedAdaptiveN.current = true
    const recommendedN = computeRecommendedN(config.n, summary.accuracy, config.adaptive)
    saveDraftSettings({ ...config, n: Math.min(recommendedN, MAX_N) })
  }, [summary, config])

  const handleAssert = useCallback(
    (kind: StreamKind) => {
      if (!acceptingInput) return
      assertStreamMatch(kind)
      setPressedStreams((current) => (current.has(kind) ? current : new Set(current).add(kind)))
    },
    [acceptingInput, assertStreamMatch],
  )

  useEffect(() => {
    if (state.status !== 'active') return

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const kind = state.activeStreams.find((streamKind) => keymap[streamKind] === key)
      if (kind) handleAssert(kind)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.status, state.activeStreams, keymap, handleAssert])

  if (summary) {
    return <SessionSummary summary={summary} onRestart={onRestart} />
  }

  const handleTogglePause = () => (paused ? resume() : pause())

  const handleAbort = () => {
    if (confirmAbort(ABORT_CONFIRM_MESSAGE)) onRestart()
  }

  const stimulus = getStimulusDisplay(state, stimulusVisible)

  return (
    <>
      <div className="flex flex-col items-center gap-4 pb-24">
        <div className="flex gap-2">
          <button type="button" onClick={handleTogglePause} className={CONTROL_BUTTON_CLASS}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" onClick={handleAbort} className={CONTROL_BUTTON_CLASS}>
            Abort
          </button>
        </div>
        <p>
          Trial {Math.min(state.currentTrialIndex + 1, state.trialCount)} of {state.trialCount}
          {paused && ' (Paused)'}
        </p>
        <Grid stimulus={stimulus} />
        <ul className="flex flex-col items-center gap-1 text-sm text-slate-500">
          {state.activeStreams.map((kind) => (
            <li key={kind} className="capitalize">
              Press <kbd>{keymap[kind].toUpperCase()}</kbd> or tap the button below when{' '}
              {kind} matches {config.n} trial(s) back
            </li>
          ))}
        </ul>
      </div>
      <StreamButtons
        activeStreams={state.activeStreams}
        pressedStreams={pressedStreams}
        feedback={feedback}
        onAssert={handleAssert}
      />
    </>
  )
}
