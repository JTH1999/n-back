import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_KEYMAP } from '../config/keymap'
import { saveKeymap } from '../persistence/keymapStorage'
import { useKeymap } from './useKeymap'

beforeEach(() => {
  window.localStorage.clear()
})

describe('useKeymap', () => {
  it('falls back to the default keymap when nothing is stored', () => {
    const { result } = renderHook(() => useKeymap())

    expect(result.current.keymap).toEqual(DEFAULT_KEYMAP)
  })

  it('restores a saved keymap', () => {
    saveKeymap({ ...DEFAULT_KEYMAP, position: 'g' })

    const { result } = renderHook(() => useKeymap())

    expect(result.current.keymap.position).toBe('g')
  })

  it('exposes a raw setter for applying a whole keymap at once', () => {
    const { result } = renderHook(() => useKeymap())

    act(() => {
      result.current.setKeymap({ position: 'j', shape: 'k', color: 'l', letter: ';' })
    })

    expect(result.current.keymap).toEqual({ position: 'j', shape: 'k', color: 'l', letter: ';' })
  })
})
