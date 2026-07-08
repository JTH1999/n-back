import { beforeEach, describe, expect, it } from 'vitest'
import type { Keymap } from '../config/keymap'
import { loadKeymap, saveKeymap } from './keymapStorage'

beforeEach(() => {
  window.localStorage.clear()
})

describe('saveKeymap / loadKeymap', () => {
  it('returns null when nothing has been saved', () => {
    expect(loadKeymap()).toBeNull()
  })

  it('round-trips a saved keymap', () => {
    const keymap: Keymap = { position: 'g', shape: 's', color: 'd', letter: 'f' }

    saveKeymap(keymap)

    expect(loadKeymap()).toEqual(keymap)
  })

  it('returns null if the stored value is not valid JSON', () => {
    window.localStorage.setItem('n-back:keymap', 'not json')

    expect(loadKeymap()).toBeNull()
  })
})
