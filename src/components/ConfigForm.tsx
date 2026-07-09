import { useEffect, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { usePresets } from '../adapters/usePresets'
import type { SessionRunnerConfig } from '../adapters/useSessionRunner'
import type { Keymap } from '../config/keymap'
import type { ThemeOverride } from '../config/theme'
import { STREAM_KINDS, type StreamKind } from '../engine/streams'
import { loadDraftSettings, saveDraftSettings } from '../persistence/settingsStorage'
import { BORDERED_CONTROL_CLASS } from '../styles/controls'
import { ExportImportPanel } from './ExportImportPanel'
import { KeymapEditor } from './KeymapEditor'
import { PresetManager } from './PresetManager'
import { ThemeToggle } from './ThemeToggle'

interface FieldRowProps {
  label: string
  className?: string
  children: ReactNode
}

function FieldRow({ label, className, children }: FieldRowProps) {
  return (
    <label className={clsx('flex items-center justify-between gap-4', className)}>
      {label}
      {children}
    </label>
  )
}

export const MAX_N = 20
const MAX_TRIAL_COUNT = 500
const MAX_DISPLAY_DURATION_MS = 60_000
const MAX_TRIAL_LENGTH_MS = 60_000

function checkRange(label: string, value: number, min: number, max: number, unit = ''): string | null {
  if (value < min) return `${label} must be at least ${min}${unit}.`
  if (value > max) return `${label} must be at most ${max}${unit}.`
  return null
}

const DEFAULT_CONFIG: SessionRunnerConfig = {
  n: 2,
  trialCount: 20,
  streams: ['position'],
  displayDurationMs: 500,
  trialLengthMs: 2500,
  volume: 1,
  muted: false,
  liveFeedback: false,
  adaptive: {
    enabled: false,
    lowerThreshold: 0.5,
    upperThreshold: 0.8,
  },
}

export interface ConfigFormProps {
  onStart: (config: SessionRunnerConfig) => void
  keymap: Keymap
  onRebindKey: (kind: StreamKind, key: string) => void
  onApplyKeymap: (keymap: Keymap) => void
  themeOverride: ThemeOverride | null
  onChangeTheme: (theme: ThemeOverride | null) => void
}

export function ConfigForm({
  onStart,
  keymap,
  onRebindKey,
  onApplyKeymap,
  themeOverride,
  onChangeTheme,
}: ConfigFormProps) {
  const [config, setConfig] = useState(() => ({
    ...DEFAULT_CONFIG,
    ...loadDraftSettings<SessionRunnerConfig>(),
  }))
  const { presets, activePresetId, savePreset, loadPreset } = usePresets()

  useEffect(() => {
    saveDraftSettings(config)
  }, [config])

  const handleSavePreset = (name: string) => {
    savePreset(name, config, keymap)
  }

  const handleLoadPreset = (id: string) => {
    const preset = loadPreset(id)
    if (!preset) return
    setConfig(preset.config)
    onApplyKeymap(preset.keymap)
  }

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
        <legend>Letter audio</legend>
        <FieldRow label="Volume">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.volume}
            disabled={config.muted}
            onChange={(event) => setConfig({ ...config, volume: Number(event.target.value) })}
          />
        </FieldRow>
        <FieldRow label="Mute">
          <input
            type="checkbox"
            checked={config.muted}
            onChange={(event) => setConfig({ ...config, muted: event.target.checked })}
          />
        </FieldRow>
      </fieldset>
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
      <ThemeToggle override={themeOverride} onChange={onChangeTheme} />
      <KeymapEditor keymap={keymap} onRebind={onRebindKey} />
      <PresetManager
        presets={presets}
        activePresetId={activePresetId}
        onSave={handleSavePreset}
        onLoad={handleLoadPreset}
      />
      <ExportImportPanel />
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
