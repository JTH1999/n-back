import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_KEYMAP } from '../config/keymap'
import { saveKeymap } from '../persistence/keymapStorage'
import { saveLastPresetId, savePresets } from '../persistence/presetStorage'
import { useKeymap } from './useKeymap'

beforeEach(() => {
  window.localStorage.clear()
})

describe('useKeymap', () => {
  it('falls back to the default keymap when nothing is stored', () => {
    const { result } = renderHook(() => useKeymap())

    expect(result.current.keymap).toEqual(DEFAULT_KEYMAP)
  })

  it('restores a saved keymap when there is no active preset', () => {
    saveKeymap({ ...DEFAULT_KEYMAP, position: 'g' })

    const { result } = renderHook(() => useKeymap())

    expect(result.current.keymap.position).toBe('g')
  })

  it('restores the active preset keymap over any saved standalone keymap', () => {
    saveKeymap({ ...DEFAULT_KEYMAP, position: 'g' })
    const preset = { id: '1', name: 'Warm-up', config: {}, keymap: { ...DEFAULT_KEYMAP, position: 'j' } }
    savePresets([preset])
    saveLastPresetId('1')

    const { result } = renderHook(() => useKeymap())

    expect(result.current.keymap.position).toBe('j')
  })

  it('exposes a raw setter for applying a whole keymap at once', () => {
    const { result } = renderHook(() => useKeymap())

    act(() => {
      result.current.setKeymap({ position: 'j', shape: 'k', color: 'l', letter: ';' })
    })

    expect(result.current.keymap).toEqual({ position: 'j', shape: 'k', color: 'l', letter: ';' })
  })
})
