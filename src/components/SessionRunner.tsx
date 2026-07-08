import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useSessionRunner,
  type SessionRunnerConfig,
} from '../adapters/useSessionRunner'
import { computeRecommendedN, getStimulusDisplay, getSummary } from '../engine/sessionEngine'
import type { Keymap } from '../config/keymap'
import type { StreamKind } from '../engine/streams'
import { appendHistoryRecord } from '../persistence/historyStorage'
import { saveDraftSettings } from '../persistence/settingsStorage'
import { MAX_N } from './ConfigForm'
import { Grid } from './Grid'
import { SessionSummary } from './SessionSummary'
import { StreamButtons } from './StreamButtons'

export interface SessionRunnerProps {
  config: SessionRunnerConfig
  keymap: Keymap
  onRestart: () => void
}

export function SessionRunner({ config, keymap, onRestart }: SessionRunnerProps) {
  const { state, stimulusVisible, feedback, readyForSummary, acceptingInput, assertStreamMatch } =
    useSessionRunner(config)
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

  const stimulus = getStimulusDisplay(state, stimulusVisible)

  return (
    <>
      <div className="flex flex-col items-center gap-4 pb-24">
        <p>
          Trial {Math.min(state.currentTrialIndex + 1, state.trialCount)} of {state.trialCount}
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
