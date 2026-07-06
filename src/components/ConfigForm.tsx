import { useEffect, useState } from 'react'
import type { SessionRunnerConfig } from '../adapters/useSessionRunner'
import { STREAM_KINDS, type StreamKind } from '../engine/streams'
import { loadDraftSettings, saveDraftSettings } from '../persistence/settingsStorage'

const DEFAULT_CONFIG: SessionRunnerConfig = {
  n: 2,
  trialCount: 20,
  streams: ['position'],
  displayDurationMs: 500,
  trialLengthMs: 2500,
  volume: 1,
  muted: false,
}

export interface ConfigFormProps {
  onStart: (config: SessionRunnerConfig) => void
}

export function ConfigForm({ onStart }: ConfigFormProps) {
  const [config, setConfig] = useState(() => ({
    ...DEFAULT_CONFIG,
    ...loadDraftSettings<SessionRunnerConfig>(),
  }))

  useEffect(() => {
    saveDraftSettings(config)
  }, [config])

  const isValid =
    config.n >= 1 &&
    config.trialCount >= 1 &&
    config.displayDurationMs >= 1 &&
    config.trialLengthMs >= 1 &&
    config.streams.length >= 1

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
          <label key={kind} className="flex items-center justify-between gap-4 capitalize">
            {kind}
            <input
              type="checkbox"
              checked={config.streams.includes(kind)}
              onChange={() => handleToggleStream(kind)}
            />
          </label>
        ))}
      </fieldset>
      <label className="flex items-center justify-between gap-4">
        N-back level
        <input
          type="number"
          min={1}
          value={config.n}
          onChange={(event) => setConfig({ ...config, n: Number(event.target.value) })}
          className="w-20 rounded border px-2 py-1"
        />
      </label>
      <label className="flex items-center justify-between gap-4">
        Trial count
        <input
          type="number"
          min={1}
          value={config.trialCount}
          onChange={(event) => setConfig({ ...config, trialCount: Number(event.target.value) })}
          className="w-20 rounded border px-2 py-1"
        />
      </label>
      <label className="flex items-center justify-between gap-4">
        Stimulus display duration (ms)
        <input
          type="number"
          min={1}
          value={config.displayDurationMs}
          onChange={(event) =>
            setConfig({ ...config, displayDurationMs: Number(event.target.value) })
          }
          className="w-20 rounded border px-2 py-1"
        />
      </label>
      <label className="flex items-center justify-between gap-4">
        Trial length (ms)
        <input
          type="number"
          min={1}
          value={config.trialLengthMs}
          onChange={(event) =>
            setConfig({ ...config, trialLengthMs: Number(event.target.value) })
          }
          className="w-20 rounded border px-2 py-1"
        />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend>Letter audio</legend>
        <label className="flex items-center justify-between gap-4">
          Volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.volume}
            disabled={config.muted}
            onChange={(event) => setConfig({ ...config, volume: Number(event.target.value) })}
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          Mute
          <input
            type="checkbox"
            checked={config.muted}
            onChange={(event) => setConfig({ ...config, muted: event.target.checked })}
          />
        </label>
      </fieldset>
      {!isValid && config.streams.length < 1 && (
        <p className="text-sm text-red-500">Select at least one stream.</p>
      )}
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
