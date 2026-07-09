import { beforeEach, describe, expect, it } from 'vitest'
import type { Preset } from '../adapters/usePresets'
import type { SessionRunnerConfig } from '../adapters/useSessionRunner'
import type { Keymap } from '../config/keymap'
import type { SessionHistoryRecord } from './historyStorage'
import { loadHistory } from './historyStorage'
import {
  EXPORT_FORMAT_VERSION,
  ImportValidationError,
  applyExportedState,
  buildExportPayload,
  parseExportedState,
} from './exportImport'
import { loadKeymap } from './keymapStorage'
import { loadDraftSettings } from './settingsStorage'
import { loadLastPresetId, loadPresets } from './presetStorage'

const config: SessionRunnerConfig = {
  n: 2,
  trialCount: 20,
  streams: ['position'],
  displayDurationMs: 500,
  trialLengthMs: 2500,
  volume: 1,
  muted: false,
  liveFeedback: false,
  adaptive: { enabled: false, lowerThreshold: 0.5, upperThreshold: 0.8 },
}

const summary = {
  totalTrials: 20,
  accuracy: 0.9,
  streams: {
    position: {
      kind: 'position' as const,
      totalTrials: 20,
      hits: 5,
      misses: 1,
      falseAlarms: 1,
      correctRejections: 13,
      accuracy: 0.9,
    },
  },
}

const historyRecord: SessionHistoryRecord = {
  timestamp: '2026-07-08T12:00:00.000Z',
  config,
  summary,
}

const preset: Preset = {
  id: 'preset-1',
  name: 'Warm-up',
  config,
  keymap: { position: 'a', shape: 's', color: 'd', letter: 'f' },
}

const keymap: Keymap = { position: 'a', shape: 's', color: 'd', letter: 'f' }

beforeEach(() => {
  window.localStorage.clear()
})

describe('buildExportPayload', () => {
  it('bundles the current history, presets, settings, and keymap', () => {
    window.localStorage.setItem('n-back:session-history', JSON.stringify([historyRecord]))
    window.localStorage.setItem('n-back:presets', JSON.stringify([preset]))
    window.localStorage.setItem('n-back:last-preset-id', preset.id)
    window.localStorage.setItem('n-back:draft-settings', JSON.stringify(config))
    window.localStorage.setItem('n-back:keymap', JSON.stringify(keymap))

    const payload = buildExportPayload()

    expect(payload.version).toBe(EXPORT_FORMAT_VERSION)
    expect(payload.history).toEqual([historyRecord])
    expect(payload.presets).toEqual([preset])
    expect(payload.lastPresetId).toBe(preset.id)
    expect(payload.draftSettings).toEqual(config)
    expect(payload.keymap).toEqual(keymap)
    expect(typeof payload.exportedAt).toBe('string')
  })

  it('falls back to empty/null values when nothing has been saved', () => {
    const payload = buildExportPayload()

    expect(payload.history).toEqual([])
    expect(payload.presets).toEqual([])
    expect(payload.lastPresetId).toBeNull()
    expect(payload.draftSettings).toBeNull()
    expect(payload.keymap).toBeNull()
  })
})

describe('parseExportedState', () => {
  it('parses a valid export payload', () => {
    const payload = {
      version: EXPORT_FORMAT_VERSION,
      exportedAt: '2026-07-08T12:00:00.000Z',
      history: [historyRecord],
      presets: [preset],
      lastPresetId: preset.id,
      draftSettings: config,
      keymap,
    }

    expect(parseExportedState(JSON.stringify(payload))).toEqual(payload)
  })

  it('accepts null lastPresetId, draftSettings, and keymap', () => {
    const payload = {
      version: EXPORT_FORMAT_VERSION,
      exportedAt: '2026-07-08T12:00:00.000Z',
      history: [],
      presets: [],
      lastPresetId: null,
      draftSettings: null,
      keymap: null,
    }

    expect(parseExportedState(JSON.stringify(payload))).toEqual(payload)
  })

  it('throws ImportValidationError for text that is not valid JSON', () => {
    expect(() => parseExportedState('not json')).toThrow(ImportValidationError)
  })

  it('throws ImportValidationError when the top level is not an object', () => {
    expect(() => parseExportedState(JSON.stringify([1, 2, 3]))).toThrow(ImportValidationError)
  })

  it('throws ImportValidationError for an unsupported version', () => {
    const payload = {
      version: EXPORT_FORMAT_VERSION + 1,
      exportedAt: '2026-07-08T12:00:00.000Z',
      history: [],
      presets: [],
      lastPresetId: null,
      draftSettings: null,
      keymap: null,
    }

    expect(() => parseExportedState(JSON.stringify(payload))).toThrow(ImportValidationError)
  })

  it('throws ImportValidationError when history records are malformed', () => {
    const payload = {
      version: EXPORT_FORMAT_VERSION,
      exportedAt: '2026-07-08T12:00:00.000Z',
      history: [{ timestamp: '2026-07-08T12:00:00.000Z' }],
      presets: [],
      lastPresetId: null,
      draftSettings: null,
      keymap: null,
    }

    expect(() => parseExportedState(JSON.stringify(payload))).toThrow(ImportValidationError)
  })

  it('backfills history and preset configs recorded before liveFeedback/adaptive existed', () => {
    const legacyConfig = {
      n: 2,
      trialCount: 20,
      streams: ['position'],
      displayDurationMs: 500,
      trialLengthMs: 2500,
      volume: 1,
    }
    const payload = {
      version: EXPORT_FORMAT_VERSION,
      exportedAt: '2026-07-08T12:00:00.000Z',
      history: [{ ...historyRecord, config: legacyConfig }],
      presets: [{ ...preset, config: legacyConfig }],
      lastPresetId: preset.id,
      draftSettings: legacyConfig,
      keymap: null,
    }

    const result = parseExportedState(JSON.stringify(payload))

    expect(result.history[0].config.adaptive).toEqual({
      enabled: false,
      lowerThreshold: 0.5,
      upperThreshold: 0.8,
    })
    expect(result.history[0].config.muted).toBe(false)
    expect(result.history[0].config.liveFeedback).toBe(false)
    expect(result.presets[0].config.adaptive).toBeDefined()
    expect(result.draftSettings?.adaptive).toBeDefined()
  })

  it('throws ImportValidationError when presets are malformed', () => {
    const payload = {
      version: EXPORT_FORMAT_VERSION,
      exportedAt: '2026-07-08T12:00:00.000Z',
      history: [],
      presets: [{ id: 'preset-1' }],
      lastPresetId: null,
      draftSettings: null,
      keymap: null,
    }

    expect(() => parseExportedState(JSON.stringify(payload))).toThrow(ImportValidationError)
  })

  it('throws ImportValidationError when a preset keymap is missing stream bindings', () => {
    const payload = {
      version: EXPORT_FORMAT_VERSION,
      exportedAt: '2026-07-08T12:00:00.000Z',
      history: [],
      presets: [{ ...preset, keymap: { position: 'a' } }],
      lastPresetId: null,
      draftSettings: null,
      keymap: null,
    }

    expect(() => parseExportedState(JSON.stringify(payload))).toThrow(ImportValidationError)
  })

  it('throws ImportValidationError when lastPresetId does not match any imported preset', () => {
    const payload = {
      version: EXPORT_FORMAT_VERSION,
      exportedAt: '2026-07-08T12:00:00.000Z',
      history: [],
      presets: [preset],
      lastPresetId: 'some-other-id',
      draftSettings: null,
      keymap: null,
    }

    expect(() => parseExportedState(JSON.stringify(payload))).toThrow(ImportValidationError)
  })
})

describe('applyExportedState', () => {
  it('replaces history, presets, last preset id, settings, and keymap', () => {
    const state = {
      version: EXPORT_FORMAT_VERSION,
      exportedAt: '2026-07-08T12:00:00.000Z',
      history: [historyRecord],
      presets: [preset],
      lastPresetId: preset.id,
      draftSettings: config,
      keymap,
    }

    applyExportedState(state)

    expect(loadHistory()).toEqual([historyRecord])
    expect(loadPresets()).toEqual([preset])
    expect(loadLastPresetId()).toBe(preset.id)
    expect(loadDraftSettings()).toEqual(config)
    expect(loadKeymap()).toEqual(keymap)
  })

  it('overwrites existing data rather than merging with it', () => {
    window.localStorage.setItem('n-back:session-history', JSON.stringify([historyRecord]))
    window.localStorage.setItem('n-back:presets', JSON.stringify([preset]))

    const state = {
      version: EXPORT_FORMAT_VERSION,
      exportedAt: '2026-07-08T12:00:00.000Z',
      history: [],
      presets: [],
      lastPresetId: null,
      draftSettings: null,
      keymap: null,
    }

    applyExportedState(state)

    expect(loadHistory()).toEqual([])
    expect(loadPresets()).toEqual([])
  })

  it('clears last preset id, settings, and keymap when they are null in the import', () => {
    window.localStorage.setItem('n-back:last-preset-id', 'existing-id')
    window.localStorage.setItem('n-back:draft-settings', JSON.stringify(config))
    window.localStorage.setItem('n-back:keymap', JSON.stringify(keymap))

    const state = {
      version: EXPORT_FORMAT_VERSION,
      exportedAt: '2026-07-08T12:00:00.000Z',
      history: [],
      presets: [],
      lastPresetId: null,
      draftSettings: null,
      keymap: null,
    }

    applyExportedState(state)

    expect(loadLastPresetId()).toBeNull()
    expect(loadDraftSettings()).toBeNull()
    expect(loadKeymap()).toBeNull()
  })
})
