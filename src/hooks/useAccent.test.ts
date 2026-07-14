import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { loadAccent } from '../persistence/accentStorage'
import { useAccent } from './useAccent'

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-accent')
})

describe('useAccent', () => {
  it('defaults to teal and sets the data-accent attribute when nothing is stored', () => {
    const { result } = renderHook(() => useAccent())

    expect(result.current.accent).toBe('teal')
    expect(document.documentElement.getAttribute('data-accent')).toBe('teal')
  })

  it('restores a saved accent', () => {
    window.localStorage.setItem('n-back:accent', 'blue')

    const { result } = renderHook(() => useAccent())

    expect(result.current.accent).toBe('blue')
    expect(document.documentElement.getAttribute('data-accent')).toBe('blue')
  })

  it('setAccent persists the choice and updates the attribute', () => {
    const { result } = renderHook(() => useAccent())

    act(() => {
      result.current.setAccent('purple')
    })

    expect(result.current.accent).toBe('purple')
    expect(loadAccent()).toBe('purple')
    expect(document.documentElement.getAttribute('data-accent')).toBe('purple')
  })
})
