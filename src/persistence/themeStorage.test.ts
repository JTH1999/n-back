import { beforeEach, describe, expect, it } from 'vitest'
import { clearThemeOverride, loadThemeOverride, saveThemeOverride } from './themeStorage'

beforeEach(() => {
  window.localStorage.clear()
})

describe('saveThemeOverride / loadThemeOverride', () => {
  it('returns null when nothing has been saved', () => {
    expect(loadThemeOverride()).toBeNull()
  })

  it('round-trips a saved override', () => {
    saveThemeOverride('dark')

    expect(loadThemeOverride()).toBe('dark')
  })

  it('returns null if the stored value is not a valid override', () => {
    window.localStorage.setItem('n-back:theme', 'not-a-theme')

    expect(loadThemeOverride()).toBeNull()
  })
})

describe('clearThemeOverride', () => {
  it('removes a saved override', () => {
    saveThemeOverride('light')

    clearThemeOverride()

    expect(loadThemeOverride()).toBeNull()
  })
})
