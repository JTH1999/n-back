import { describe, expect, it } from 'vitest'
import { DEFAULT_KEYMAP, rebindKeymap } from './keymap'

describe('rebindKeymap', () => {
  it('assigns a new key to a stream that is not used elsewhere', () => {
    const result = rebindKeymap(DEFAULT_KEYMAP, 'position', 'g')

    expect(result.position).toBe('g')
    expect(result.shape).toBe(DEFAULT_KEYMAP.shape)
    expect(result.color).toBe(DEFAULT_KEYMAP.color)
    expect(result.letter).toBe(DEFAULT_KEYMAP.letter)
  })

  it('swaps bindings when the key is already used by another stream', () => {
    const result = rebindKeymap(DEFAULT_KEYMAP, 'position', DEFAULT_KEYMAP.shape)

    expect(result.position).toBe(DEFAULT_KEYMAP.shape)
    expect(result.shape).toBe(DEFAULT_KEYMAP.position)
  })

  it('never produces a duplicate binding', () => {
    const result = rebindKeymap(DEFAULT_KEYMAP, 'letter', DEFAULT_KEYMAP.color)
    const keys = Object.values(result)

    expect(new Set(keys).size).toBe(keys.length)
  })

  it('normalizes the key to lowercase', () => {
    const result = rebindKeymap(DEFAULT_KEYMAP, 'position', 'G')

    expect(result.position).toBe('g')
  })

  it('is a no-op when rebinding a stream to its current key', () => {
    const result = rebindKeymap(DEFAULT_KEYMAP, 'position', DEFAULT_KEYMAP.position)

    expect(result).toEqual(DEFAULT_KEYMAP)
  })
})
