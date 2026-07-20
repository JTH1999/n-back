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

  it('does not show a rename button when onRename is not provided', () => {
    render(<PresetList presets={presets} activePresetId={null} onLoad={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /rename warm-up/i })).not.toBeInTheDocument()
  })

  it('shows an inline rename input when the rename button is clicked', () => {
    render(<PresetList presets={presets} activePresetId={null} onLoad={vi.fn()} onRename={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /rename warm-up/i }))

    expect(screen.getByLabelText(/new name for warm-up/i)).toHaveValue('Warm-up')
  })

  it('calls onRename with the trimmed new name when Enter is pressed', () => {
    const onRename = vi.fn()
    render(<PresetList presets={presets} activePresetId={null} onLoad={vi.fn()} onRename={onRename} />)

    fireEvent.click(screen.getByRole('button', { name: /rename warm-up/i }))
    fireEvent.change(screen.getByLabelText(/new name for warm-up/i), {
      target: { value: '  Morning warm-up  ' },
    })
    fireEvent.keyDown(screen.getByLabelText(/new name for warm-up/i), { key: 'Enter' })

    expect(onRename).toHaveBeenCalledWith('1', 'Morning warm-up')
    expect(screen.queryByRole('textbox', { name: /rename warm-up/i })).not.toBeInTheDocument()
  })

  it('calls onRename with the trimmed new name when Save is clicked', () => {
    const onRename = vi.fn()
    render(<PresetList presets={presets} activePresetId={null} onLoad={vi.fn()} onRename={onRename} />)

    fireEvent.click(screen.getByRole('button', { name: /rename warm-up/i }))
    fireEvent.change(screen.getByLabelText(/new name for warm-up/i), { target: { value: 'Morning warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    expect(onRename).toHaveBeenCalledWith('1', 'Morning warm-up')
  })

  it('cancels the rename without calling onRename when Escape is pressed', () => {
    const onRename = vi.fn()
    render(<PresetList presets={presets} activePresetId={null} onLoad={vi.fn()} onRename={onRename} />)

    fireEvent.click(screen.getByRole('button', { name: /rename warm-up/i }))
    fireEvent.change(screen.getByLabelText(/new name for warm-up/i), { target: { value: 'Morning warm-up' } })
    fireEvent.keyDown(screen.getByLabelText(/new name for warm-up/i), { key: 'Escape' })

    expect(onRename).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: /rename warm-up/i })).not.toBeInTheDocument()
    expect(screen.getByText('Warm-up')).toBeInTheDocument()
  })

  it('cancels the rename without calling onRename when Cancel is clicked', () => {
    const onRename = vi.fn()
    render(<PresetList presets={presets} activePresetId={null} onLoad={vi.fn()} onRename={onRename} />)

    fireEvent.click(screen.getByRole('button', { name: /rename warm-up/i }))
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))

    expect(onRename).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: /rename warm-up/i })).not.toBeInTheDocument()
  })

  it('does not call onRename when the trimmed name is empty', () => {
    const onRename = vi.fn()
    render(<PresetList presets={presets} activePresetId={null} onLoad={vi.fn()} onRename={onRename} />)

    fireEvent.click(screen.getByRole('button', { name: /rename warm-up/i }))
    fireEvent.change(screen.getByLabelText(/new name for warm-up/i), { target: { value: '   ' } })
    fireEvent.keyDown(screen.getByLabelText(/new name for warm-up/i), { key: 'Enter' })

    expect(onRename).not.toHaveBeenCalled()
  })

  it('shows a Template badge for read-only presets', () => {
    const readOnlyPresets: Preset[] = [{ id: '1', name: 'Standard', config, readOnly: true }]
    render(<PresetList presets={readOnlyPresets} activePresetId={null} onLoad={vi.fn()} />)

    expect(screen.getByText(/template/i)).toBeInTheDocument()
  })

  it('hides rename and delete buttons for a read-only preset even when the handlers are provided', () => {
    const readOnlyPresets: Preset[] = [{ id: '1', name: 'Standard', config, readOnly: true }]
    render(
      <PresetList
        presets={readOnlyPresets}
        activePresetId={null}
        onLoad={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: /rename standard/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete standard/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^load$/i })).toBeInTheDocument()
  })
})
