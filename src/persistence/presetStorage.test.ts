import { beforeEach, describe, expect, it } from 'vitest'
import {
  loadLastPresetId,
  loadPresets,
  saveLastPresetId,
  savePresets,
} from './presetStorage'

interface Preset {
  id: string
  name: string
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('savePresets / loadPresets', () => {
  it('returns null when nothing has been saved', () => {
    expect(loadPresets<Preset[]>()).toBeNull()
  })

  it('round-trips a saved preset list', () => {
    const presets: Preset[] = [{ id: '1', name: 'Warm-up' }]

    savePresets(presets)

    expect(loadPresets<Preset[]>()).toEqual(presets)
  })

  it('returns null if the stored value is not valid JSON', () => {
    window.localStorage.setItem('n-back:presets', 'not json')

    expect(loadPresets<Preset[]>()).toBeNull()
  })
})

describe('saveLastPresetId / loadLastPresetId', () => {
  it('returns null when nothing has been saved', () => {
    expect(loadLastPresetId()).toBeNull()
  })

  it('round-trips a saved id', () => {
    saveLastPresetId('abc-123')

    expect(loadLastPresetId()).toBe('abc-123')
  })
})
