import type { Preset } from '../hooks/usePresets'
import type { SessionRunnerConfig } from '../hooks/useSessionRunner'
import type { Keymap } from '../config/keymap'
import { STREAM_KINDS } from '../engine/streams'
import { loadHistory, replaceHistory, type SessionHistoryRecord } from './historyStorage'
import { clearKeymap, loadKeymap, saveKeymap } from './keymapStorage'
import {
  clearLastPresetId,
  loadLastPresetId,
  loadPresets,
  saveLastPresetId,
  savePresets,
} from './presetStorage'
import { clearDraftSettings, loadDraftSettings, saveDraftSettings } from './settingsStorage'

export const EXPORT_FORMAT_VERSION = 1

export interface ExportedState {
  version: number
  exportedAt: string
  history: SessionHistoryRecord[]
  presets: Preset[]
  lastPresetId: string | null
  draftSettings: SessionRunnerConfig | null
  keymap: Partial<Keymap> | null
}

export class ImportValidationError extends Error {}

export function buildExportPayload(): ExportedState {
  return {
    version: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    history: loadHistory(),
    presets: loadPresets<Preset[]>() ?? [],
    lastPresetId: loadLastPresetId(),
    draftSettings: loadDraftSettings<SessionRunnerConfig>(),
    keymap: loadKeymap(),
  }
}

export function parseExportedState(raw: string): ExportedState {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new ImportValidationError('File is not valid JSON.')
  }

  if (!isPlainObject(parsed)) {
    throw new ImportValidationError('File does not contain a valid backup.')
  }
  if (parsed.version !== EXPORT_FORMAT_VERSION) {
    throw new ImportValidationError(
      `Unsupported backup version (expected ${EXPORT_FORMAT_VERSION}).`,
    )
  }
  if (typeof parsed.exportedAt !== 'string') {
    throw new ImportValidationError('Backup is missing an export date.')
  }
  if (!Array.isArray(parsed.history)) {
    throw new ImportValidationError('Session history is missing or malformed.')
  }
  const history = parsed.history.map(normalizeHistoryRecord)
  if (!history.every(isHistoryRecord)) {
    throw new ImportValidationError('Session history is missing or malformed.')
  }
  if (!Array.isArray(parsed.presets)) {
    throw new ImportValidationError('Presets are missing or malformed.')
  }
  const presets = parsed.presets.map(normalizePreset)
  if (!presets.every(isPreset)) {
    throw new ImportValidationError('Presets are missing or malformed.')
  }
  if (parsed.lastPresetId !== null && typeof parsed.lastPresetId !== 'string') {
    throw new ImportValidationError('Last-used preset id is malformed.')
  }
  if (parsed.lastPresetId !== null && !presets.some((preset) => preset.id === parsed.lastPresetId)) {
    throw new ImportValidationError('Last-used preset id does not match any imported preset.')
  }
  const draftSettings =
    parsed.draftSettings !== null ? normalizeSessionRunnerConfig(parsed.draftSettings) : null
  if (draftSettings !== null && !isSessionRunnerConfig(draftSettings)) {
    throw new ImportValidationError('Settings are missing or malformed.')
  }
  if (parsed.keymap !== null && !isPartialKeymap(parsed.keymap)) {
    throw new ImportValidationError('Keymap is malformed.')
  }

  return {
    version: parsed.version,
    exportedAt: parsed.exportedAt,
    history,
    presets,
    lastPresetId: parsed.lastPresetId,
    draftSettings,
    keymap: parsed.keymap,
  }
}

export function applyExportedState(state: ExportedState): void {
  replaceHistory(state.history)
  savePresets(state.presets)

  if (state.lastPresetId !== null) saveLastPresetId(state.lastPresetId)
  else clearLastPresetId()

  if (state.draftSettings !== null) saveDraftSettings(state.draftSettings)
  else clearDraftSettings()

  if (state.keymap !== null) saveKeymap(state.keymap as Keymap)
  else clearKeymap()
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Backfills config fields added after the app's initial release (liveFeedback,
// adaptive) so history/presets/settings saved before those features shipped
// still pass import validation instead of being rejected as malformed.
function normalizeSessionRunnerConfig(value: unknown): unknown {
  if (!isPlainObject(value)) return value
  const adaptive = isPlainObject(value.adaptive) ? value.adaptive : {}
  return {
    ...value,
    muted: typeof value.muted === 'boolean' ? value.muted : false,
    liveFeedback: typeof value.liveFeedback === 'boolean' ? value.liveFeedback : false,
    adaptive: {
      enabled: typeof adaptive.enabled === 'boolean' ? adaptive.enabled : false,
      lowerThreshold: typeof adaptive.lowerThreshold === 'number' ? adaptive.lowerThreshold : 0.5,
      upperThreshold: typeof adaptive.upperThreshold === 'number' ? adaptive.upperThreshold : 0.8,
    },
  }
}

function normalizeHistoryRecord(value: unknown): unknown {
  if (!isPlainObject(value)) return value
  return { ...value, config: normalizeSessionRunnerConfig(value.config) }
}

function normalizePreset(value: unknown): unknown {
  if (!isPlainObject(value)) return value
  return { ...value, config: normalizeSessionRunnerConfig(value.config) }
}

function isSessionRunnerConfig(value: unknown): value is SessionRunnerConfig {
  if (!isPlainObject(value)) return false
  const adaptive = value.adaptive
  return (
    typeof value.n === 'number' &&
    typeof value.trialCount === 'number' &&
    Array.isArray(value.streams) &&
    value.streams.every((stream) => typeof stream === 'string') &&
    typeof value.displayDurationMs === 'number' &&
    typeof value.trialLengthMs === 'number' &&
    typeof value.volume === 'number' &&
    typeof value.muted === 'boolean' &&
    typeof value.liveFeedback === 'boolean' &&
    isPlainObject(adaptive) &&
    typeof adaptive.enabled === 'boolean' &&
    typeof adaptive.lowerThreshold === 'number' &&
    typeof adaptive.upperThreshold === 'number'
  )
}

function isSessionSummary(value: unknown): boolean {
  if (!isPlainObject(value)) return false
  return (
    typeof value.totalTrials === 'number' &&
    typeof value.accuracy === 'number' &&
    isPlainObject(value.streams)
  )
}

function isHistoryRecord(value: unknown): value is SessionHistoryRecord {
  if (!isPlainObject(value)) return false
  return (
    typeof value.timestamp === 'string' &&
    isSessionRunnerConfig(value.config) &&
    isSessionSummary(value.summary)
  )
}

function isPartialKeymap(value: unknown): value is Partial<Keymap> {
  if (!isPlainObject(value)) return false
  return Object.entries(value).every(
    ([kind, key]) => STREAM_KINDS.includes(kind as (typeof STREAM_KINDS)[number]) && typeof key === 'string',
  )
}

function isKeymap(value: unknown): value is Keymap {
  return isPartialKeymap(value) && STREAM_KINDS.every((kind) => typeof value[kind] === 'string')
}

function isPreset(value: unknown): value is Preset {
  if (!isPlainObject(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isSessionRunnerConfig(value.config) &&
    isKeymap(value.keymap)
  )
}
