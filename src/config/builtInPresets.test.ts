import { describe, expect, it } from 'vitest'
import { BUILT_IN_PRESETS } from './builtInPresets'

describe('BUILT_IN_PRESETS', () => {
  it('provides exactly Easy, Standard, and Hard, in that order', () => {
    expect(BUILT_IN_PRESETS.map((preset) => preset.name)).toEqual(['Easy', 'Standard', 'Hard'])
  })

  it('marks every built-in preset as readOnly', () => {
    expect(BUILT_IN_PRESETS.every((preset) => preset.readOnly)).toBe(true)
  })

  it('gives every built-in preset a stable, unique id', () => {
    const ids = BUILT_IN_PRESETS.map((preset) => preset.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(['builtin-easy', 'builtin-standard', 'builtin-hard'])
  })

  it('shares the same n, streams, trial count, display duration, and match rate across presets', () => {
    for (const preset of BUILT_IN_PRESETS) {
      expect(preset.config).toMatchObject({
        n: 2,
        streams: ['position', 'letter'],
        trialCount: 20,
        displayDurationMs: 500,
        matchRate: 0.3,
      })
    }
  })

  it('only varies trial length between presets, fastest for Hard and slowest for Easy', () => {
    const [easy, standard, hard] = BUILT_IN_PRESETS
    expect(easy.config.trialLengthMs).toBe(4000)
    expect(standard.config.trialLengthMs).toBe(3000)
    expect(hard.config.trialLengthMs).toBe(2000)
  })
})
