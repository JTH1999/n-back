import { beforeEach, describe, expect, it } from 'vitest'
import { loadDraftSettings, saveDraftSettings } from './settingsStorage'

interface Draft {
  n: number
  streams: string[]
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('saveDraftSettings / loadDraftSettings', () => {
  it('returns null when nothing has been saved', () => {
    expect(loadDraftSettings<Draft>()).toBeNull()
  })

  it('round-trips a saved settings object', () => {
    const draft: Draft = { n: 3, streams: ['position', 'letter'] }

    saveDraftSettings(draft)

    expect(loadDraftSettings<Draft>()).toEqual(draft)
  })

  it('returns null if the stored value is not valid JSON', () => {
    window.localStorage.setItem('n-back:draft-settings', 'not json')

    expect(loadDraftSettings<Draft>()).toBeNull()
  })
})
