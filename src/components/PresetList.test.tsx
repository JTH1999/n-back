import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Preset } from '../hooks/usePresets'
import { PresetList } from './PresetList'

const config = {
  n: 2,
  trialCount: 20,
  streams: ['position'] as const,
  displayDurationMs: 500,
  trialLengthMs: 2500,
  liveFeedback: false,
  adaptive: { enabled: false, lowerThreshold: 0.5, upperThreshold: 0.8 },
}

const presets: Preset[] = [
  { id: '1', name: 'Warm-up', config },
  { id: '2', name: 'Hard mode', config: { ...config, n: 4 } },
]

describe('PresetList', () => {
  it('shows an empty state when there are no saved presets', () => {
    render(
      <PresetList presets={[]} activePresetId={null} onLoad={vi.fn()} onDelete={vi.fn()} />,
    )

    expect(screen.getByText(/no saved presets/i)).toBeInTheDocument()
  })

  it('marks the active preset', () => {
    render(
      <PresetList
        presets={presets}
        activePresetId="2"
        onLoad={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText(/active/i)).toBeInTheDocument()
  })

  it('shows a modified badge instead of active when the active preset has drifted', () => {
    render(
      <PresetList
        presets={presets}
        activePresetId="2"
        isActiveModified
        onLoad={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText(/modified/i)).toBeInTheDocument()
    expect(screen.queryByText(/^active$/i)).not.toBeInTheDocument()
  })

  it('renders each preset with its name and config summary', () => {
    render(<PresetList presets={presets} activePresetId={null} onLoad={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('Warm-up')).toBeInTheDocument()
    expect(screen.getByText('N2 · position · 20t')).toBeInTheDocument()
    expect(screen.getByText('Hard mode')).toBeInTheDocument()
    expect(screen.getByText('N4 · position · 20t')).toBeInTheDocument()
  })

  it('calls onLoad with the preset id when Load is clicked', () => {
    const onLoad = vi.fn()
    render(<PresetList presets={presets} activePresetId={null} onLoad={onLoad} onDelete={vi.fn()} />)

    fireEvent.click(screen.getAllByRole('button', { name: /^load$/i })[1])

    expect(onLoad).toHaveBeenCalledWith('2')
  })

  it('calls onDelete with the preset id when its delete button is clicked', () => {
    const onDelete = vi.fn()
    render(<PresetList presets={presets} activePresetId={null} onLoad={vi.fn()} onDelete={onDelete} />)

    fireEvent.click(screen.getByRole('button', { name: /delete warm-up/i }))

    expect(onDelete).toHaveBeenCalledWith('1')
  })
})
