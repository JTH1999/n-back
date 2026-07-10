import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_KEYMAP } from '../config/keymap'
import { SettingsScreen, type SettingsScreenProps } from './SettingsScreen'

function renderSettingsScreen(overrides: Partial<SettingsScreenProps> = {}) {
  const props: SettingsScreenProps = {
    keymap: DEFAULT_KEYMAP,
    onRebindKey: vi.fn(),
    themeOverride: null,
    onChangeTheme: vi.fn(),
    ...overrides,
  }
  return { ...render(<SettingsScreen {...props} />), props }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('SettingsScreen', () => {
  it('renders the Settings heading', () => {
    renderSettingsScreen()

    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
  })

  it('renders the keymap editor and reports rebinds', () => {
    const onRebindKey = vi.fn()
    renderSettingsScreen({ onRebindKey })

    fireEvent.click(screen.getByRole('button', { name: /rebind position/i }))
    fireEvent.keyDown(window, { key: 'g' })

    expect(onRebindKey).toHaveBeenCalledWith('position', 'g')
  })

  it('renders the theme toggle and reports selection changes', () => {
    const onChangeTheme = vi.fn()
    renderSettingsScreen({ themeOverride: null, onChangeTheme })

    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }))

    expect(onChangeTheme).toHaveBeenCalledWith('dark')
  })

  it('renders the volume and mute controls, persisting changes to the draft config', () => {
    const { unmount } = renderSettingsScreen()

    fireEvent.click(screen.getByLabelText(/mute/i))
    unmount()

    renderSettingsScreen()

    expect(screen.getByLabelText(/mute/i)).toBeChecked()
    expect(screen.getByLabelText(/volume/i)).toBeDisabled()
  })

  it('renders the export/import panel', () => {
    renderSettingsScreen()

    expect(screen.getByRole('button', { name: /export data/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument()
  })
})
