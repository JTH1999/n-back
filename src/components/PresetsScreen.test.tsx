import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDraftConfig } from '../hooks/useDraftConfig'
import { PresetsScreen, type PresetsScreenProps } from './PresetsScreen'

type PresetsScreenOverrides = Partial<Omit<PresetsScreenProps, 'config' | 'setConfig'>>

function PresetsScreenHarness(overrides: PresetsScreenOverrides) {
  const [config, setConfig] = useDraftConfig()
  return (
    <>
      <button onClick={() => setConfig((current) => ({ ...current, n: 5, volume: 0.2, muted: true }))}>
        mutate draft
      </button>
      <pre data-testid="config">{JSON.stringify(config)}</pre>
      <PresetsScreen config={config} setConfig={setConfig} {...overrides} />
    </>
  )
}

function renderPresetsScreen(overrides: PresetsScreenOverrides = {}) {
  return render(<PresetsScreenHarness {...overrides} />)
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('PresetsScreen', () => {
  it('renders the Presets heading', () => {
    renderPresetsScreen()

    expect(screen.getByRole('heading', { name: /presets/i })).toBeInTheDocument()
  })

  it('shows an empty state and the current config summary before anything is saved', () => {
    renderPresetsScreen()

    expect(screen.getByText(/no saved presets/i)).toBeInTheDocument()
    expect(screen.getByText('N2 · position · 20t')).toBeInTheDocument()
  })

  it('saves the current draft settings as a named preset', () => {
    renderPresetsScreen()

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    expect(screen.getByText('Warm-up')).toBeInTheDocument()
    expect(screen.getByText(/active/i)).toBeInTheDocument()
  })

  it('loads a saved preset, restoring training params without touching audio settings', () => {
    renderPresetsScreen()

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.click(screen.getByRole('button', { name: /mutate draft/i }))
    expect(screen.getByText('N5 · position · 20t')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^load$/i }))

    expect(screen.getAllByText('N2 · position · 20t').length).toBeGreaterThan(0)
    const config = JSON.parse(screen.getByTestId('config').textContent ?? '{}')
    expect(config.volume).toBe(0.2)
    expect(config.muted).toBe(true)
  })

  it('deletes a saved preset', () => {
    renderPresetsScreen()

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))
    expect(screen.getByText('Warm-up')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /delete warm-up/i }))

    expect(screen.queryByText('Warm-up')).not.toBeInTheDocument()
    expect(screen.getByText(/no saved presets/i)).toBeInTheDocument()
  })

  it('restores the most recently saved preset on mount', () => {
    const { unmount } = renderPresetsScreen()

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))
    unmount()

    renderPresetsScreen()

    expect(screen.getByText('Warm-up')).toBeInTheDocument()
  })
})
