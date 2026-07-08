import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_KEYMAP } from '../config/keymap'
import type { Preset } from '../adapters/usePresets'
import { PresetManager } from './PresetManager'

const config = {
  n: 2,
  trialCount: 20,
  streams: ['position'] as const,
  displayDurationMs: 500,
  trialLengthMs: 2500,
  volume: 1,
  muted: false,
  liveFeedback: false,
  adaptive: { enabled: false, lowerThreshold: 0.5, upperThreshold: 0.8 },
}

const presets: Preset[] = [
  { id: '1', name: 'Warm-up', config, keymap: DEFAULT_KEYMAP },
  { id: '2', name: 'Hard mode', config, keymap: DEFAULT_KEYMAP },
]

describe('PresetManager', () => {
  it('disables save until a name is entered', () => {
    render(<PresetManager presets={[]} activePresetId={null} onSave={vi.fn()} onLoad={vi.fn()} />)

    expect(screen.getByRole('button', { name: /save preset/i })).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })

    expect(screen.getByRole('button', { name: /save preset/i })).not.toBeDisabled()
  })

  it('saves a preset with the entered name and clears the field', () => {
    const onSave = vi.fn()
    render(<PresetManager presets={[]} activePresetId={null} onSave={onSave} onLoad={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    expect(onSave).toHaveBeenCalledWith('Warm-up')
    expect(screen.getByLabelText(/preset name/i)).toHaveValue('')
  })

  it('does not render the preset picker when there are no saved presets', () => {
    render(<PresetManager presets={[]} activePresetId={null} onSave={vi.fn()} onLoad={vi.fn()} />)

    expect(screen.queryByLabelText(/select a preset/i)).not.toBeInTheDocument()
  })

  it('lists saved presets and marks the active one', () => {
    render(
      <PresetManager presets={presets} activePresetId="2" onSave={vi.fn()} onLoad={vi.fn()} />,
    )

    expect(screen.getByRole('option', { name: 'Warm-up' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Hard mode (active)' })).toBeInTheDocument()
  })

  it('loads the selected preset', () => {
    const onLoad = vi.fn()
    render(
      <PresetManager presets={presets} activePresetId={null} onSave={vi.fn()} onLoad={onLoad} />,
    )

    fireEvent.change(screen.getByLabelText(/select a preset/i), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: /^load$/i }))

    expect(onLoad).toHaveBeenCalledWith('2')
  })

  it('disables load until a preset is selected', () => {
    render(
      <PresetManager presets={presets} activePresetId={null} onSave={vi.fn()} onLoad={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: /^load$/i })).toBeDisabled()
  })
})
