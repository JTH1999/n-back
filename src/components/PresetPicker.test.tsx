import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDraftConfig } from '../hooks/useDraftConfig'
import { PresetPicker } from './PresetPicker'

function PresetPickerHarness() {
  const [config, setConfig] = useDraftConfig()
  return (
    <>
      <button onClick={() => setConfig((current) => ({ ...current, n: 5 }))}>mutate draft</button>
      <pre data-testid="config">{JSON.stringify(config)}</pre>
      <PresetPicker config={config} setConfig={setConfig} />
    </>
  )
}

function renderPresetPicker() {
  return render(<PresetPickerHarness />)
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('PresetPicker', () => {
  it('shows an empty state before any preset is saved', () => {
    renderPresetPicker()

    expect(screen.getByRole('button', { name: /no preset/i })).toBeInTheDocument()
  })

  it('opens to reveal the preset list and save panel', () => {
    renderPresetPicker()

    fireEvent.click(screen.getByRole('button', { name: /no preset/i }))

    expect(screen.getByText(/no saved presets/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/preset name/i)).toBeInTheDocument()
  })

  it('saves the current draft config as a new preset and shows it as active', () => {
    renderPresetPicker()

    fireEvent.click(screen.getByRole('button', { name: /no preset/i }))
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    expect(screen.getByRole('button', { name: /^warm-up/i })).toBeInTheDocument()
  })

  it('loads a saved preset into the shared draft config without navigating away', () => {
    renderPresetPicker()

    fireEvent.click(screen.getByRole('button', { name: /no preset/i }))
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.click(screen.getByRole('button', { name: /mutate draft/i }))
    expect(JSON.parse(screen.getByTestId('config').textContent ?? '{}').n).toBe(5)

    fireEvent.click(screen.getByRole('button', { name: /^load$/i }))

    expect(JSON.parse(screen.getByTestId('config').textContent ?? '{}').n).toBe(2)
  })

  it('closes the picker after loading a preset', () => {
    renderPresetPicker()

    fireEvent.click(screen.getByRole('button', { name: /no preset/i }))
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.click(screen.getByRole('button', { name: /^load$/i }))

    expect(screen.queryByLabelText(/preset name/i)).not.toBeInTheDocument()
  })
})
