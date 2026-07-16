import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Preset } from '../hooks/usePresets'
import { ManagePresetsModal } from './ManagePresetsModal'

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

describe('ManagePresetsModal', () => {
  it('renders as a dialog listing all saved presets', () => {
    render(
      <ManagePresetsModal
        presets={presets}
        activePresetId={null}
        onLoad={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('dialog', { name: /manage presets/i })).toBeInTheDocument()
    expect(screen.getByText('Warm-up')).toBeInTheDocument()
    expect(screen.getByText('Hard mode')).toBeInTheDocument()
  })

  it('calls onRename with the new name when a preset is renamed', () => {
    const onRename = vi.fn()
    render(
      <ManagePresetsModal
        presets={presets}
        activePresetId={null}
        onLoad={vi.fn()}
        onRename={onRename}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /rename warm-up/i }))
    fireEvent.change(screen.getByLabelText(/new name for warm-up/i), { target: { value: 'Morning warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    expect(onRename).toHaveBeenCalledWith('1', 'Morning warm-up')
  })

  it('calls onDelete with the preset id when deleted', () => {
    const onDelete = vi.fn()
    render(
      <ManagePresetsModal
        presets={presets}
        activePresetId={null}
        onLoad={vi.fn()}
        onRename={vi.fn()}
        onDelete={onDelete}
        onClose={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /delete warm-up/i }))

    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('calls onClose when the Close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <ManagePresetsModal
        presets={presets}
        activePresetId={null}
        onLoad={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onClose={onClose}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /^close$/i }))

    expect(onClose).toHaveBeenCalled()
  })

  it('shows the empty state when there are no saved presets', () => {
    render(
      <ManagePresetsModal
        presets={[]}
        activePresetId={null}
        onLoad={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText(/no saved presets/i)).toBeInTheDocument()
  })
})
