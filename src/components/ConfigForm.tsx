import clsx from 'clsx'
import type { Dispatch, SetStateAction } from 'react'
import { unlockAudio } from '../audio/letterAudio'
import { sessionDurationMs } from '../derived/sessionDuration'
import type { SessionRunnerConfig } from '../hooks/useSessionRunner'
import { DEFAULT_MATCH_RATE } from '../engine/sessionEngine'
import { STREAM_KINDS, type StreamKind } from '../engine/streams'
import { formatDuration } from '../utils/formatDuration'
import { Button } from './Button'
import { MAX_N, NStepper } from './NStepper'
import { Panel } from './Panel'
import { PresetPicker } from './PresetPicker'
import { ScreenHeader } from './ScreenHeader'
import { SliderParam } from './SliderParam'
import { StreamCard } from './StreamCard'
import { SubHeading } from './SubHeading'
import { TwoColumnLayout } from './TwoColumnLayout'

const MAX_TRIAL_COUNT = 500
const MAX_DISPLAY_DURATION_MS = 60_000
const MAX_TRIAL_LENGTH_MS = 60_000

function checkRange(label: string, value: number, min: number, max: number, unit = ''): string | null {
  if (value < min) return `${label} must be at least ${min}${unit}.`
  if (value > max) return `${label} must be at most ${max}${unit}.`
  return null
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`
}

interface ToggleRowProps {
  label: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ label, hint, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-4 last:border-none">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span>{label}</span>
        <span className="font-mono text-xs font-normal text-dim">{hint}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative h-6 w-[42px] flex-none rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-border',
        )}
      >
        <span
          className={clsx(
            'absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-white transition-transform',
            checked && 'translate-x-[18px]',
          )}
        />
      </button>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border py-1.5 font-mono text-xs text-dim last:border-none">
      <span>{label}</span>
      <span className="font-semibold text-fg">{value}</span>
    </div>
  )
}

export interface ConfigFormProps {
  config: SessionRunnerConfig
  setConfig: Dispatch<SetStateAction<SessionRunnerConfig>>
  onStart: (config: SessionRunnerConfig) => void
}

export function ConfigForm({ config, setConfig, onStart }: ConfigFormProps) {
  const validationMessage =
    config.streams.length < 1
      ? 'Select at least one stream.'
      : (checkRange('N-back level', config.n, 1, MAX_N) ??
        checkRange('Trial count', config.trialCount, 1, MAX_TRIAL_COUNT) ??
        checkRange('Stimulus display duration', config.displayDurationMs, 1, MAX_DISPLAY_DURATION_MS, 'ms') ??
        checkRange('Trial length', config.trialLengthMs, 1, MAX_TRIAL_LENGTH_MS, 'ms') ??
        (config.displayDurationMs > config.trialLengthMs
          ? 'Stimulus display duration must not exceed the trial length.'
          : null) ??
        (config.adaptive.enabled
          ? (checkRange('Lower accuracy threshold', config.adaptive.lowerThreshold, 0, 1) ??
            checkRange('Upper accuracy threshold', config.adaptive.upperThreshold, 0, 1) ??
            (config.adaptive.lowerThreshold > config.adaptive.upperThreshold
              ? 'Lower accuracy threshold must not exceed the upper threshold.'
              : null))
          : null))

  const isValid = validationMessage === null
  const matchRate = config.matchRate ?? DEFAULT_MATCH_RATE

  const handleToggleStream = (kind: StreamKind) => {
    setConfig((current) => ({
      ...current,
      streams: current.streams.includes(kind)
        ? current.streams.filter((activeKind) => activeKind !== kind)
        : [...current.streams, kind],
    }))
  }

  const handleN = (n: number) => setConfig({ ...config, n })

  const judgedCount = Math.max(0, config.trialCount - config.n)
  const estimatedDuration = formatDuration(sessionDurationMs(config.trialCount, config.trialLengthMs))
  const activeStreamsSummary = config.streams.length > 0 ? config.streams.join(', ') : 'None'

  return (
    <form
      className="flex flex-col gap-7"
      onSubmit={(event) => {
        event.preventDefault()
        if (isValid) {
          unlockAudio()
          onStart(config)
        }
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <ScreenHeader eyebrow="Configure" title="Session Setup" />
        <div className="flex items-center gap-3">
          <PresetPicker config={config} setConfig={setConfig} />
          <Button type="submit" disabled={!isValid}>
            Start Session →
          </Button>
        </div>
      </div>

      <fieldset className="flex flex-col gap-4">
        <SubHeading as="legend" className="mb-1">
          Streams · toggle 1–4
        </SubHeading>
        <div className="grid grid-cols-2 gap-3 shell:grid-cols-4">
          {STREAM_KINDS.map((kind) => (
            <StreamCard
              key={kind}
              kind={kind}
              active={config.streams.includes(kind)}
              onToggle={() => handleToggleStream(kind)}
            />
          ))}
        </div>
      </fieldset>

      <TwoColumnLayout
        main={
          <Panel>
            <div className="flex items-center justify-between gap-3 border-b border-border py-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>Global N</span>
                <span className="font-mono text-xs font-normal text-dim">back-distance</span>
              </div>
              <NStepper value={config.n} onChange={handleN} ariaLabel="N-back level" />
            </div>
            <SliderParam
              label="Stimulus duration"
              ariaLabel="Stimulus display duration"
              valueLabel={formatMs(config.displayDurationMs)}
              min={200}
              max={3000}
              step={200}
              value={config.displayDurationMs}
              onChange={(value) => setConfig({ ...config, displayDurationMs: value })}
            />
            <SliderParam
              label="Trial length"
              ariaLabel="Trial length"
              valueLabel={formatMs(config.trialLengthMs)}
              min={1500}
              max={6000}
              step={100}
              value={config.trialLengthMs}
              onChange={(value) => setConfig({ ...config, trialLengthMs: value })}
            />
            <SliderParam
              label="Trials per session"
              ariaLabel="Trial count"
              valueLabel={`${config.trialCount}`}
              min={5}
              max={60}
              step={1}
              value={config.trialCount}
              onChange={(value) => setConfig({ ...config, trialCount: value })}
            />
            <SliderParam
              label="Match rate"
              ariaLabel="Match rate"
              valueLabel={`${Math.round(matchRate * 100)}%`}
              min={0.1}
              max={0.5}
              step={0.05}
              value={matchRate}
              onChange={(value) => setConfig({ ...config, matchRate: value })}
            />
            <ToggleRow
              label="Live feedback"
              hint="show correctness mid-trial"
              checked={config.liveFeedback}
              onChange={(checked) => setConfig({ ...config, liveFeedback: checked })}
            />
            <ToggleRow
              label="Adaptive mode"
              hint="auto-adjust N between sessions"
              checked={config.adaptive.enabled}
              onChange={(checked) =>
                setConfig({ ...config, adaptive: { ...config.adaptive, enabled: checked } })
              }
            />
            {config.adaptive.enabled && (
              <div className="flex flex-col gap-2 py-2">
                <SliderParam
                  label="Increase above"
                  ariaLabel="Upper accuracy threshold (increase N above this)"
                  valueLabel={`${Math.round(config.adaptive.upperThreshold * 100)}%`}
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.adaptive.upperThreshold}
                  onChange={(value) =>
                    setConfig({ ...config, adaptive: { ...config.adaptive, upperThreshold: value } })
                  }
                />
                <SliderParam
                  label="Decrease below"
                  ariaLabel="Lower accuracy threshold (decrease N below this)"
                  valueLabel={`${Math.round(config.adaptive.lowerThreshold * 100)}%`}
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.adaptive.lowerThreshold}
                  onChange={(value) =>
                    setConfig({ ...config, adaptive: { ...config.adaptive, lowerThreshold: value } })
                  }
                />
              </div>
            )}
          </Panel>
        }
        side={
          <Panel>
            <SubHeading className="mb-3">Configuration</SubHeading>
            <InfoLine label="Active streams" value={activeStreamsSummary} />
            <InfoLine label="Match rate" value={`${Math.round(matchRate * 100)}%`} />
            <InfoLine label="Est. duration" value={estimatedDuration} />
            <InfoLine label="Judged trials" value={`${judgedCount}`} />
            {validationMessage && (
              <p role="alert" className="mt-3.5 flex gap-2 font-mono text-xs text-danger">
                <span aria-hidden="true">⚠</span>
                <span>{validationMessage}</span>
              </p>
            )}
          </Panel>
        }
      />
    </form>
  )
}
