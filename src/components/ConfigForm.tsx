import { useState } from 'react'
import type { SessionRunnerConfig } from '../adapters/useSessionRunner'

const DEFAULT_CONFIG: SessionRunnerConfig = {
  n: 2,
  trialCount: 20,
  displayDurationMs: 500,
  trialLengthMs: 2500,
}

export interface ConfigFormProps {
  onStart: (config: SessionRunnerConfig) => void
}

export function ConfigForm({ onStart }: ConfigFormProps) {
  const [config, setConfig] = useState(DEFAULT_CONFIG)

  const isValid = config.n >= 1 && config.trialCount >= 1

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (isValid) onStart(config)
      }}
    >
      <label className="flex items-center justify-between gap-4">
        N-back level
        <input
          type="number"
          min={1}
          value={config.n}
          onChange={(event) =>
            setConfig({ ...config, n: Number(event.target.value) })
          }
          className="w-20 rounded border px-2 py-1"
        />
      </label>
      <label className="flex items-center justify-between gap-4">
        Trial count
        <input
          type="number"
          min={1}
          value={config.trialCount}
          onChange={(event) =>
            setConfig({ ...config, trialCount: Number(event.target.value) })
          }
          className="w-20 rounded border px-2 py-1"
        />
      </label>
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
