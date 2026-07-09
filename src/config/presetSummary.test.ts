import { describe, expect, it } from 'vitest'
import type { SessionRunnerConfig } from '../adapters/useSessionRunner'
import { summarizePresetConfig } from './presetSummary'

const baseConfig: SessionRunnerConfig = {
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

describe('summarizePresetConfig', () => {
  it('summarizes the n-back level, streams, and trial count', () => {
    expect(summarizePresetConfig(baseConfig)).toBe('N2 · position · 20t')
  })

  it('joins multiple streams', () => {
    expect(
      summarizePresetConfig({ ...baseConfig, streams: ['position', 'letter'] }),
    ).toBe('N2 · position, letter · 20t')
  })

  it('falls back to "none" when no streams are active', () => {
    expect(summarizePresetConfig({ ...baseConfig, streams: [] })).toBe('N2 · none · 20t')
  })
})
