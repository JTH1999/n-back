import { fireEvent, render, screen, within } from '@testing-library/react'
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
    fireEvent.click(screen.getByRole('button', { name: /discard and load/i }))

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

  it('shows a modified marker once the draft config drifts from the active preset', () => {
    renderPresetPicker()

    fireEvent.click(screen.getByRole('button', { name: /no preset/i }))
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    expect(screen.queryByLabelText(/modified/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /mutate draft/i }))

    expect(screen.getByLabelText(/modified/i)).toBeInTheDocument()
  })

  it('clears the modified marker after reloading the same preset via the confirm dialog', () => {
    renderPresetPicker()

    fireEvent.click(screen.getByRole('button', { name: /no preset/i }))
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))
    fireEvent.click(screen.getByRole('button', { name: /mutate draft/i }))

    fireEvent.click(screen.getByRole('button', { name: /^load$/i }))
    fireEvent.click(screen.getByRole('button', { name: /discard and load/i }))

    fireEvent.click(screen.getByRole('button', { name: /^warm-up/i }))
    expect(screen.queryByLabelText(/modified/i)).not.toBeInTheDocument()
  })

  it('shows a confirm dialog when reloading the same preset while modified', () => {
    renderPresetPicker()

    fireEvent.click(screen.getByRole('button', { name: /no preset/i }))
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))
    fireEvent.click(screen.getByRole('button', { name: /mutate draft/i }))

    fireEvent.click(screen.getByRole('button', { name: /^load$/i }))

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('loads a different preset immediately when unmodified, with no confirm dialog', () => {
    renderPresetPicker()

    fireEvent.click(screen.getByRole('button', { name: /no preset/i }))
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Hard mode' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.click(screen.getAllByRole('button', { name: /^load$/i })[0])

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(JSON.parse(screen.getByTestId('config').textContent ?? '{}').n).toBe(2)
  })

  it('shows a confirm dialog when loading a different preset while modified', () => {
    renderPresetPicker()

    fireEvent.click(screen.getByRole('button', { name: /no preset/i }))
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Hard mode' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.click(screen.getByRole('button', { name: /mutate draft/i }))
    fireEvent.click(screen.getAllByRole('button', { name: /^load$/i })[0])

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('cancel leaves the modified draft and active preset untouched', () => {
    renderPresetPicker()

    fireEvent.click(screen.getByRole('button', { name: /no preset/i }))
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Hard mode' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.click(screen.getByRole('button', { name: /mutate draft/i }))
    fireEvent.click(screen.getAllByRole('button', { name: /^load$/i })[0])

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(JSON.parse(screen.getByTestId('config').textContent ?? '{}').n).toBe(5)
  })

  it('discard and load drops modifications and loads the target preset', () => {
    renderPresetPicker()

    fireEvent.click(screen.getByRole('button', { name: /no preset/i }))
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Hard mode' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.click(screen.getByRole('button', { name: /mutate draft/i }))
    fireEvent.click(screen.getAllByRole('button', { name: /^load$/i })[0])

    fireEvent.click(screen.getByRole('button', { name: /discard and load/i }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(JSON.parse(screen.getByTestId('config').textContent ?? '{}').n).toBe(2)
  })

  it('save as new preset saves the modified draft then loads the target preset', () => {
    renderPresetPicker()

    fireEvent.click(screen.getByRole('button', { name: /no preset/i }))
    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Hard mode' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.click(screen.getByRole('button', { name: /mutate draft/i }))
    fireEvent.click(screen.getAllByRole('button', { name: /^load$/i })[0])

    const dialog = screen.getByRole('alertdialog')
    fireEvent.change(within(dialog).getByLabelText(/new preset name/i), {
      target: { value: 'My drift' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: /save.*load/i }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(JSON.parse(screen.getByTestId('config').textContent ?? '{}').n).toBe(2)

    fireEvent.click(screen.getByRole('button', { name: /^warm-up/i }))
    expect(screen.getByText('My drift')).toBeInTheDocument()
  })
})
