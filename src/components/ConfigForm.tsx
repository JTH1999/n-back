import { useDraftConfig } from '../hooks/useDraftConfig'
import type { SessionRunnerConfig } from '../hooks/useSessionRunner'
import { STREAM_KINDS, type StreamKind } from '../engine/streams'
import { FieldRow } from './FieldRow'
import { NumberFieldRow } from './NumberFieldRow'

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
      <NumberFieldRow
        label="N-back level"
        min={1}
        max={MAX_N}
        value={config.n}
        onChange={(value) => setConfig({ ...config, n: value })}
      />
      <NumberFieldRow
        label="Trial count"
        min={1}
        max={MAX_TRIAL_COUNT}
        value={config.trialCount}
        onChange={(value) => setConfig({ ...config, trialCount: value })}
      />
      <NumberFieldRow
        label="Stimulus display duration (ms)"
        min={1}
        max={MAX_DISPLAY_DURATION_MS}
        value={config.displayDurationMs}
        onChange={(value) => setConfig({ ...config, displayDurationMs: value })}
      />
      <NumberFieldRow
        label="Trial length (ms)"
        min={1}
        max={MAX_TRIAL_LENGTH_MS}
        value={config.trialLengthMs}
        onChange={(value) => setConfig({ ...config, trialLengthMs: value })}
      />
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
            <NumberFieldRow
              label="Lower accuracy threshold (decrease N below this)"
              min={0}
              max={1}
              step={0.05}
              value={config.adaptive.lowerThreshold}
              onChange={(value) =>
                setConfig({ ...config, adaptive: { ...config.adaptive, lowerThreshold: value } })
              }
            />
            <NumberFieldRow
              label="Upper accuracy threshold (increase N above this)"
              min={0}
              max={1}
              step={0.05}
              value={config.adaptive.upperThreshold}
              onChange={(value) =>
                setConfig({ ...config, adaptive: { ...config.adaptive, upperThreshold: value } })
              }
            />
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
