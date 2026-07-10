import clsx from 'clsx'
import { useDraftConfig } from '../adapters/useDraftConfig'
import type { SessionRunnerConfig } from '../adapters/useSessionRunner'
import { STREAM_KINDS, type StreamKind } from '../engine/streams'
import { BORDERED_CONTROL_CLASS } from '../styles/controls'
import { FieldRow } from './FieldRow'

export const MAX_N = 20
const MAX_TRIAL_COUNT = 500
const MAX_DISPLAY_DURATION_MS = 60_000
const MAX_TRIAL_LENGTH_MS = 60_000

function checkRange(label: string, value: number, min: number, max: number, unit = ''): string | null {
  if (value < min) return `${label} must be at least ${min}${unit}.`
  if (value > max) return `${label} must be at most ${max}${unit}.`
  return null
}

export interface ConfigFormProps {
  onStart: (config: SessionRunnerConfig) => void
}

export function ConfigForm({ onStart }: ConfigFormProps) {
  const [config, setConfig] = useDraftConfig()

  const validationMessage =
    config.streams.length < 1
      ? 'Select at least one stream.'
      : (checkRange('N-back level', config.n, 1, MAX_N) ??
        checkRange('Trial count', config.trialCount, 1, MAX_TRIAL_COUNT) ??
        checkRange('Stimulus display duration', config.displayDurationMs, 1, MAX_DISPLAY_DURATION_MS, 'ms') ??
        checkRange('Trial length', config.trialLengthMs, 1, MAX_TRIAL_LENGTH_MS, 'ms') ??
        (config.adaptive.enabled
          ? (checkRange('Lower accuracy threshold', config.adaptive.lowerThreshold, 0, 1) ??
            checkRange('Upper accuracy threshold', config.adaptive.upperThreshold, 0, 1) ??
            (config.adaptive.lowerThreshold > config.adaptive.upperThreshold
              ? 'Lower accuracy threshold must not exceed the upper threshold.'
              : null))
          : null))

  const isValid = validationMessage === null

  const handleToggleStream = (kind: StreamKind) => {
    setConfig((current) => ({
      ...current,
      streams: current.streams.includes(kind)
        ? current.streams.filter((activeKind) => activeKind !== kind)
        : [...current.streams, kind],
    }))
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (isValid) onStart(config)
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend>Streams</legend>
        {STREAM_KINDS.map((kind) => (
          <FieldRow key={kind} label={kind} className="capitalize">
            <input
              type="checkbox"
              checked={config.streams.includes(kind)}
              onChange={() => handleToggleStream(kind)}
            />
          </FieldRow>
        ))}
      </fieldset>
      <FieldRow label="N-back level">
        <input
          type="number"
          min={1}
          max={MAX_N}
          value={config.n}
          onChange={(event) => setConfig({ ...config, n: Number(event.target.value) })}
          className={clsx(BORDERED_CONTROL_CLASS, 'w-20 px-2 py-1')}
        />
      </FieldRow>
      <FieldRow label="Trial count">
        <input
          type="number"
          min={1}
          max={MAX_TRIAL_COUNT}
          value={config.trialCount}
          onChange={(event) => setConfig({ ...config, trialCount: Number(event.target.value) })}
          className={clsx(BORDERED_CONTROL_CLASS, 'w-20 px-2 py-1')}
        />
      </FieldRow>
      <FieldRow label="Stimulus display duration (ms)">
        <input
          type="number"
          min={1}
          max={MAX_DISPLAY_DURATION_MS}
          value={config.displayDurationMs}
          onChange={(event) =>
            setConfig({ ...config, displayDurationMs: Number(event.target.value) })
          }
          className={clsx(BORDERED_CONTROL_CLASS, 'w-20 px-2 py-1')}
        />
      </FieldRow>
      <FieldRow label="Trial length (ms)">
        <input
          type="number"
          min={1}
          max={MAX_TRIAL_LENGTH_MS}
          value={config.trialLengthMs}
          onChange={(event) =>
            setConfig({ ...config, trialLengthMs: Number(event.target.value) })
          }
          className={clsx(BORDERED_CONTROL_CLASS, 'w-20 px-2 py-1')}
        />
      </FieldRow>
      <fieldset className="flex flex-col gap-2">
        <legend>Feedback</legend>
        <FieldRow label="Live feedback (show per-trial results)">
          <input
            type="checkbox"
            checked={config.liveFeedback}
            onChange={(event) => setConfig({ ...config, liveFeedback: event.target.checked })}
          />
        </FieldRow>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend>Adaptive difficulty</legend>
        <FieldRow label="Adaptive mode (auto-adjust N between sessions)">
          <input
            type="checkbox"
            checked={config.adaptive.enabled}
            onChange={(event) =>
              setConfig({
                ...config,
                adaptive: { ...config.adaptive, enabled: event.target.checked },
              })
            }
          />
        </FieldRow>
        {config.adaptive.enabled && (
          <>
            <FieldRow label="Lower accuracy threshold (decrease N below this)">
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={config.adaptive.lowerThreshold}
                onChange={(event) =>
                  setConfig({
                    ...config,
                    adaptive: { ...config.adaptive, lowerThreshold: Number(event.target.value) },
                  })
                }
                className={clsx(BORDERED_CONTROL_CLASS, 'w-20 px-2 py-1')}
              />
            </FieldRow>
            <FieldRow label="Upper accuracy threshold (increase N above this)">
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={config.adaptive.upperThreshold}
                onChange={(event) =>
                  setConfig({
                    ...config,
                    adaptive: { ...config.adaptive, upperThreshold: Number(event.target.value) },
                  })
                }
                className={clsx(BORDERED_CONTROL_CLASS, 'w-20 px-2 py-1')}
              />
            </FieldRow>
          </>
        )}
      </fieldset>
      {validationMessage && <p className="text-sm text-red-500">{validationMessage}</p>}
      <button
        type="submit"
        disabled={!isValid}
        className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
      >
        Start session
      </button>
    </form>
  )
}
