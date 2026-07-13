import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  useSessionRunner,
  type SessionRunnerConfig,
} from '../hooks/useSessionRunner'
import { computeRecommendedN, getStimulusDisplay, getSummary } from '../engine/sessionEngine'
import type { Keymap } from '../config/keymap'
import type { StreamKind } from '../engine/streams'
import { appendHistoryRecord } from '../persistence/historyStorage'
import { saveDraftSettings } from '../persistence/settingsStorage'
import { Button } from './Button'
import { MAX_N } from './ConfigForm'
import { Grid } from './Grid'
import { Overlay } from './Overlay'
import { SessionSummary, type AdaptiveRecommendation } from './SessionSummary'
import { StreamButtons } from './StreamButtons'

export interface SessionRunnerProps {
  config: SessionRunnerConfig
  keymap: Keymap
  onRestart: () => void
  isFocused?: boolean
}

function AudioCue({ active }: { active: boolean }) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 font-mono text-xs tracking-[0.1em] transition-colors',
        active ? 'text-stream-letter opacity-100' : 'text-dim2 opacity-40',
      )}
    >
      <span className="text-base">♪</span> audio letter
    </div>
  )
}

function ProgressBar({ trialIndex, trialCount }: { trialIndex: number; trialCount: number }) {
  const percent = Math.min(100, Math.round(((trialIndex + 1) / trialCount) * 100))
  return (
    <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-border">
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export function SessionRunner({ config, keymap, onRestart, isFocused = true }: SessionRunnerProps) {
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
    restart,
  } = useSessionRunner(config)
  const [pressedStreams, setPressedStreams] = useState<ReadonlySet<StreamKind>>(new Set())
  const [showAbortConfirm, setShowAbortConfirm] = useState(false)
  const wasPausedBeforeAbort = useRef(false)
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

  const recommendedN = useMemo(() => {
    if (!summary || !config.adaptive.enabled) return null
    return Math.min(computeRecommendedN(config.n, summary.accuracy, config.adaptive), MAX_N)
  }, [summary, config])

  const recommendation: AdaptiveRecommendation | null = useMemo(() => {
    if (recommendedN === null) return null
    const note =
      recommendedN > config.n ? 'increased' : recommendedN < config.n ? 'decreased' : 'held steady'
    return { n: recommendedN, note }
  }, [recommendedN, config.n])

  useEffect(() => {
    if (recommendedN === null || hasAppliedAdaptiveN.current) return
    hasAppliedAdaptiveN.current = true
    saveDraftSettings({ ...config, n: recommendedN })
  }, [recommendedN, config])

  const handleAssert = useCallback(
    (kind: StreamKind) => {
      if (!acceptingInput) return
      assertStreamMatch(kind)
      setPressedStreams((current) => (current.has(kind) ? current : new Set(current).add(kind)))
    },
    [acceptingInput, assertStreamMatch],
  )

  useEffect(() => {
    if (!isFocused) pause()
  }, [isFocused, pause])

  useEffect(() => {
    if (state.status !== 'active' || !isFocused) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const kind = state.activeStreams.find((streamKind) => keymap[streamKind] === key)
      if (kind) handleAssert(kind)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.status, state.activeStreams, keymap, handleAssert, isFocused])

  // Renders nothing while another tab is active. The component itself stays
  // mounted (not the tree in App), so its timers keep running and pause
  // above, and its state (including a completed summary) survives the trip.
  if (!isFocused) return null

  const handleRetry = () => {
    hasRecordedHistory.current = false
    hasAppliedAdaptiveN.current = false
    setPressedStreams(new Set())
    restart()
  }

  if (summary) {
    return (
      <SessionSummary
        summary={summary}
        n={config.n}
        trialCount={config.trialCount}
        recommendation={recommendation}
        onRetry={handleRetry}
        onDone={onRestart}
      />
    )
  }

  const handleTogglePause = () => (paused ? resume() : pause())
  const handleAbortClick = () => {
    wasPausedBeforeAbort.current = paused
    pause()
    setShowAbortConfirm(true)
  }
  const handleAbortDecline = () => {
    setShowAbortConfirm(false)
    if (!wasPausedBeforeAbort.current) resume()
  }
  const handleAbortConfirm = () => {
    setShowAbortConfirm(false)
    onRestart()
  }

  const stimulus = getStimulusDisplay(state, stimulusVisible)
  const audioActive = stimulusVisible && state.activeStreams.includes('letter')

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[640px] flex-col items-center gap-3">
      <div className="mb-auto flex w-full items-center justify-between gap-3">
        <span className="whitespace-nowrap rounded-[7px] border border-accent bg-accent-dim px-3 py-1.5 font-mono text-[13px] font-semibold text-accent">
          N = {config.n}
        </span>
        <span className="text-sm tracking-[0.08em] text-dim">
          Trial {Math.min(state.currentTrialIndex + 1, state.trialCount)} of {state.trialCount}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleTogglePause}>
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="ghost" onClick={handleAbortClick} className="text-danger">
            Abort
          </Button>
        </div>
      </div>

      <div className="my-auto flex flex-col items-center gap-[22px]">
        <Grid stimulus={stimulus} />
        <AudioCue active={audioActive} />
      </div>

      <StreamButtons
        activeStreams={state.activeStreams}
        pressedStreams={pressedStreams}
        keymap={keymap}
        feedback={feedback}
        onAssert={handleAssert}
      />
      <ProgressBar trialIndex={state.currentTrialIndex} trialCount={state.trialCount} />

      {paused && !showAbortConfirm && (
        <Overlay role="dialog" ariaLabel="Session paused">
          <h2 className="text-[22px] font-semibold">Paused</h2>
          <p className="text-sm text-dim">Trial timing is frozen. Resume when you're ready.</p>
          <Button onClick={resume} className="mt-3">
            Resume →
          </Button>
        </Overlay>
      )}

      {showAbortConfirm && (
        <Overlay role="alertdialog" ariaLabel="Abort session confirmation">
          <h2 className="text-[22px] font-semibold">Abort session?</h2>
          <p className="text-sm text-dim">This session won't be saved to your history.</p>
          <div className="mt-3 flex gap-2.5">
            <Button variant="ghost" onClick={handleAbortDecline}>
              Keep training
            </Button>
            <Button variant="danger" onClick={handleAbortConfirm}>
              Abort
            </Button>
          </div>
        </Overlay>
      )}
    </div>
  )
}
