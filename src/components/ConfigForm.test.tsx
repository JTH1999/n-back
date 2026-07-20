import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDraftConfig } from '../hooks/useDraftConfig'
import { ConfigForm, type ConfigFormProps } from './ConfigForm'

function ConfigFormHarness(overrides: Partial<Omit<ConfigFormProps, 'config' | 'setConfig'>>) {
  const [config, setConfig] = useDraftConfig()
  return <ConfigForm config={config} setConfig={setConfig} onStart={vi.fn()} {...overrides} />
}

function renderConfigForm(overrides: Partial<Omit<ConfigFormProps, 'config' | 'setConfig'>> = {}) {
  return render(<ConfigFormHarness {...overrides} />)
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
    fireEvent.click(screen.getByLabelText(/live feedback/i))
    unmount()

    renderConfigForm()

    expect(screen.getByLabelText(/n-back level/i)).toHaveValue(5)
    expect(screen.getByLabelText(/letter/i)).toBeChecked()
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

  it('fills in missing fields from defaults when the saved draft is from an older schema', () => {
    window.localStorage.setItem('n-back:draft-settings', JSON.stringify({ n: 4 }))

    renderConfigForm()

    expect(screen.getByLabelText(/n-back level/i)).toHaveValue(4)
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

  it('saves a preset on Enter from the picker instead of starting a session', () => {
    const onStart = vi.fn()
    renderConfigForm({ onStart })

    fireEvent.click(screen.getByRole('button', { name: /no preset/i }))
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.keyDown(screen.getByLabelText(/preset name/i), { key: 'Enter' })

    expect(onStart).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /^warm-up/i })).toBeInTheDocument()
  })

  it('defaults the match rate slider to 30% and starts a session with it', () => {
    const onStart = vi.fn()
    renderConfigForm({ onStart })

    expect(screen.getByLabelText(/match rate/i)).toHaveValue('0.3')

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))

    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ matchRate: 0.3 }))
  })

  it('applies a changed match rate to the started session', () => {
    const onStart = vi.fn()
    renderConfigForm({ onStart })

    fireEvent.change(screen.getByLabelText(/match rate/i), { target: { value: '0.45' } })
    fireEvent.click(screen.getByRole('button', { name: /start session/i }))

    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ matchRate: 0.45 }))
  })

  it('rejects a lower adaptive threshold above the upper threshold', () => {
    renderConfigForm()

    fireEvent.click(screen.getByLabelText(/adaptive mode/i))
    fireEvent.change(screen.getByLabelText(/lower accuracy threshold/i), { target: { value: '0.9' } })
    fireEvent.change(screen.getByLabelText(/upper accuracy threshold/i), { target: { value: '0.4' } })

    expect(screen.getByText(/lower accuracy threshold must not exceed/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled()
  })
})
