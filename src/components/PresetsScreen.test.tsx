import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_KEYMAP } from '../config/keymap'
import { useDraftConfig } from '../hooks/useDraftConfig'
import { PresetsScreen, type PresetsScreenProps } from './PresetsScreen'

type PresetsScreenOverrides = Partial<Omit<PresetsScreenProps, 'config' | 'setConfig'>>

function PresetsScreenHarness(overrides: PresetsScreenOverrides) {
  const [config, setConfig] = useDraftConfig()
  return (
    <PresetsScreen
      config={config}
      setConfig={setConfig}
      keymap={DEFAULT_KEYMAP}
      onApplyKeymap={vi.fn()}
      {...overrides}
    />
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

  it('saves the current draft settings and keymap as a named preset', () => {
    renderPresetsScreen({ keymap: { ...DEFAULT_KEYMAP, position: 'g' } })

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    expect(screen.getByText('Warm-up')).toBeInTheDocument()
    expect(screen.getByText(/active/i)).toBeInTheDocument()
  })

  it('loads a saved preset, replacing the draft config and reporting the keymap', () => {
    const onApplyKeymap = vi.fn()
    renderPresetsScreen({ keymap: { ...DEFAULT_KEYMAP, position: 'g' }, onApplyKeymap })

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Hard mode' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.click(screen.getByRole('button', { name: /^load$/i }))

    expect(onApplyKeymap).toHaveBeenCalledWith({ ...DEFAULT_KEYMAP, position: 'g' })
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
