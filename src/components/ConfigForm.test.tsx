import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_KEYMAP } from '../config/keymap'
import { ConfigForm, type ConfigFormProps } from './ConfigForm'

function renderConfigForm(overrides: Partial<ConfigFormProps> = {}) {
  const props: ConfigFormProps = {
    onStart: vi.fn(),
    keymap: DEFAULT_KEYMAP,
    onRebindKey: vi.fn(),
    onApplyKeymap: vi.fn(),
    themeOverride: null,
    onChangeTheme: vi.fn(),
    ...overrides,
  }
  return { ...render(<ConfigForm {...props} />), props }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('ConfigForm', () => {
  it('starts a session with the default draft settings', () => {
    const onStart = vi.fn()
    renderConfigForm({ onStart })

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))

    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ n: 2, trialCount: 20, streams: ['position'] }),
    )
  })

  it('rejects starting a session with zero active streams', () => {
    const onStart = vi.fn()
    renderConfigForm({ onStart })

    fireEvent.click(screen.getByLabelText(/position/i))

    expect(screen.getByText(/select at least one stream/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))
    expect(onStart).not.toHaveBeenCalled()
  })

  it('persists changed settings to localStorage and restores them on next mount', () => {
    const { unmount } = renderConfigForm()

    fireEvent.change(screen.getByLabelText(/n-back level/i), { target: { value: '5' } })
    fireEvent.click(screen.getByLabelText(/letter/i))
    fireEvent.click(screen.getByLabelText(/mute/i))
    fireEvent.click(screen.getByLabelText(/live feedback/i))
    unmount()

    renderConfigForm()

    expect(screen.getByLabelText(/n-back level/i)).toHaveValue(5)
    expect(screen.getByLabelText(/letter/i)).toBeChecked()
    expect(screen.getByLabelText(/mute/i)).toBeChecked()
    expect(screen.getByLabelText(/live feedback/i)).toBeChecked()
  })

  it('defaults live feedback to off', () => {
    renderConfigForm()

    expect(screen.getByLabelText(/live feedback/i)).not.toBeChecked()
  })

  it('starts a session with live feedback disabled by default', () => {
    const onStart = vi.fn()
    renderConfigForm({ onStart })

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))

    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ liveFeedback: false }))
  })

  it('disables the volume slider while muted', () => {
    renderConfigForm()

    fireEvent.click(screen.getByLabelText(/mute/i))

    expect(screen.getByLabelText(/volume/i)).toBeDisabled()
  })

  it('fills in missing fields from defaults when the saved draft is from an older schema', () => {
    window.localStorage.setItem('n-back:draft-settings', JSON.stringify({ n: 4 }))

    renderConfigForm()

    expect(screen.getByLabelText(/n-back level/i)).toHaveValue(4)
    expect(screen.getByLabelText(/volume/i)).not.toBeDisabled()
    expect(screen.getByLabelText(/mute/i)).not.toBeChecked()
  })

  it('defaults adaptive mode to off', () => {
    renderConfigForm()

    expect(screen.getByLabelText(/adaptive mode/i)).not.toBeChecked()
    expect(screen.queryByLabelText(/lower accuracy threshold/i)).not.toBeInTheDocument()
  })

  it('starts a session with adaptive mode disabled by default', () => {
    const onStart = vi.fn()
    renderConfigForm({ onStart })

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))

    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({
        adaptive: { enabled: false, lowerThreshold: 0.5, upperThreshold: 0.8 },
      }),
    )
  })

  it('reveals and applies adaptive thresholds when enabled', () => {
    const onStart = vi.fn()
    renderConfigForm({ onStart })

    fireEvent.click(screen.getByLabelText(/adaptive mode/i))
    fireEvent.change(screen.getByLabelText(/lower accuracy threshold/i), { target: { value: '0.4' } })
    fireEvent.change(screen.getByLabelText(/upper accuracy threshold/i), { target: { value: '0.9' } })
    fireEvent.click(screen.getByRole('button', { name: /start session/i }))

    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({
        adaptive: { enabled: true, lowerThreshold: 0.4, upperThreshold: 0.9 },
      }),
    )
  })

  it('rejects a lower adaptive threshold above the upper threshold', () => {
    renderConfigForm()

    fireEvent.click(screen.getByLabelText(/adaptive mode/i))
    fireEvent.change(screen.getByLabelText(/lower accuracy threshold/i), { target: { value: '0.9' } })
    fireEvent.change(screen.getByLabelText(/upper accuracy threshold/i), { target: { value: '0.4' } })

    expect(screen.getByText(/lower accuracy threshold must not exceed/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled()
  })

  it('renders the theme toggle and reports selection changes', () => {
    const onChangeTheme = vi.fn()
    renderConfigForm({ themeOverride: null, onChangeTheme })

    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }))

    expect(onChangeTheme).toHaveBeenCalledWith('dark')
  })

  it('renders the keymap editor and reports rebinds', () => {
    const onRebindKey = vi.fn()
    renderConfigForm({ onRebindKey })

    fireEvent.click(screen.getByRole('button', { name: /rebind position/i }))
    fireEvent.keyDown(window, { key: 'g' })

    expect(onRebindKey).toHaveBeenCalledWith('position', 'g')
  })

  it('saves the current settings and keymap as a named preset', () => {
    renderConfigForm({ keymap: { ...DEFAULT_KEYMAP, position: 'g' } })

    fireEvent.change(screen.getByLabelText(/n-back level/i), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    expect(screen.getByRole('option', { name: 'Warm-up (active)' })).toBeInTheDocument()
  })

  it('loads a saved preset, replacing the current config and keymap', () => {
    const onApplyKeymap = vi.fn()
    renderConfigForm({ keymap: { ...DEFAULT_KEYMAP, position: 'g' }, onApplyKeymap })

    fireEvent.change(screen.getByLabelText(/n-back level/i), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Hard mode' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.change(screen.getByLabelText(/n-back level/i), { target: { value: '2' } })

    fireEvent.change(screen.getByLabelText(/select a preset/i), {
      target: { value: screen.getByRole('option', { name: /hard mode/i }).getAttribute('value') },
    })
    fireEvent.click(screen.getByRole('button', { name: /^load$/i }))

    expect(screen.getByLabelText(/n-back level/i)).toHaveValue(5)
    expect(onApplyKeymap).toHaveBeenCalledWith({ ...DEFAULT_KEYMAP, position: 'g' })
  })

  it('restores the most recently saved preset on mount, including which preset is marked active', () => {
    const { unmount } = renderConfigForm()

    fireEvent.change(screen.getByLabelText(/n-back level/i), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))
    unmount()

    renderConfigForm()

    expect(screen.getByLabelText(/n-back level/i)).toHaveValue(5)
    expect(screen.getByRole('option', { name: 'Warm-up (active)' })).toBeInTheDocument()
  })

  it('keeps manually-adjusted settings on mount rather than reverting to a previously used preset', () => {
    const { unmount } = renderConfigForm()

    fireEvent.change(screen.getByLabelText(/n-back level/i), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.change(screen.getByLabelText(/n-back level/i), { target: { value: '7' } })
    unmount()

    renderConfigForm()

    expect(screen.getByLabelText(/n-back level/i)).toHaveValue(7)
  })
})
