import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadThemeOverride, saveThemeOverride } from '../persistence/themeStorage'
import { useTheme } from './useTheme'

function stubMatchMedia(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const mediaQueryList = {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener)
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener)
    },
  }
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mediaQueryList))
  return {
    fireChange: (nextMatches: boolean) => {
      mediaQueryList.matches = nextMatches
      listeners.forEach((listener) => listener({ matches: nextMatches } as MediaQueryListEvent))
    },
  }
}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.classList.remove('dark')
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'theme-color')
  document.head.appendChild(meta)
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.querySelector('meta[name="theme-color"]')?.remove()
})

describe('useTheme', () => {
  it('falls back to the system light preference when nothing is stored', () => {
    stubMatchMedia(false)
    const { result } = renderHook(() => useTheme())

    expect(result.current.override).toBeNull()
    expect(result.current.resolvedTheme).toBe('light')
  })

  it('falls back to the system dark preference when nothing is stored', () => {
    stubMatchMedia(true)
    const { result } = renderHook(() => useTheme())

    expect(result.current.resolvedTheme).toBe('dark')
  })

  it('applies the dark class to the document element when resolved to dark', () => {
    stubMatchMedia(true)
    renderHook(() => useTheme())

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('restores a saved override and takes precedence over the system preference', () => {
    stubMatchMedia(true)
    saveThemeOverride('light')

    const { result } = renderHook(() => useTheme())

    expect(result.current.override).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('setOverride persists the override and updates the resolved theme', () => {
    stubMatchMedia(false)
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setOverride('dark')
    })

    expect(result.current.resolvedTheme).toBe('dark')
    expect(loadThemeOverride()).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('setOverride(null) clears the persisted override and reverts to the system preference', () => {
    stubMatchMedia(true)
    saveThemeOverride('light')
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setOverride(null)
    })

    expect(result.current.override).toBeNull()
    expect(result.current.resolvedTheme).toBe('dark')
    expect(loadThemeOverride()).toBeNull()
  })

  it('sets the theme-color meta tag to match the light background', () => {
    stubMatchMedia(false)
    renderHook(() => useTheme())

    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#f2f5f6')
  })

  it('sets the theme-color meta tag to match the dark background', () => {
    stubMatchMedia(true)
    renderHook(() => useTheme())

    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#15181b')
  })

  it('updates the theme-color meta tag when the override changes', () => {
    stubMatchMedia(false)
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setOverride('dark')
    })

    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#15181b')
  })

  it('tracks system preference changes when no override is set', () => {
    const { fireChange } = stubMatchMedia(false)
    const { result } = renderHook(() => useTheme())

    act(() => {
      fireChange(true)
    })

    expect(result.current.resolvedTheme).toBe('dark')
  })
})
