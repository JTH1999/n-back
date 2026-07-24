import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_KEYMAP } from '../config/keymap'
import { useDraftConfig } from '../hooks/useDraftConfig'
import { SettingsScreen, type SettingsScreenProps } from './SettingsScreen'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    status: 'unauthenticated',
    email: null,
    error: null,
    isPasswordRecovery: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updatePassword: vi.fn(),
    clearError: vi.fn(),
  }),
}))

type SettingsScreenOverrides = Partial<Omit<SettingsScreenProps, 'config' | 'setConfig'>>

function SettingsScreenHarness(overrides: SettingsScreenOverrides) {
  const [config, setConfig] = useDraftConfig()
  return (
    <SettingsScreen
      config={config}
      setConfig={setConfig}
      keymap={DEFAULT_KEYMAP}
      onRebindKey={vi.fn()}
      themeOverride={null}
      onChangeTheme={vi.fn()}
      accent="teal"
      onChangeAccent={vi.fn()}
      {...overrides}
    />
  )
}

function renderSettingsScreen(overrides: SettingsScreenOverrides = {}) {
  return render(<SettingsScreenHarness {...overrides} />)
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

    expect(screen.getByLabelText(/mute/i)).toBeChecked()

    fireEvent.click(screen.getByLabelText(/mute/i))
    unmount()

    renderSettingsScreen()

    expect(screen.getByLabelText(/mute/i)).not.toBeChecked()
    expect(screen.getByLabelText(/volume/i)).toBeDisabled()
  })

  it('renders the export/import panel', () => {
    renderSettingsScreen()

    expect(screen.getByRole('button', { name: /export data/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument()
  })

  it('renders the account panel', () => {
    renderSettingsScreen()

    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })
})
