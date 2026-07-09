import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_KEYMAP } from '../config/keymap'
import { PresetsScreen, type PresetsScreenProps } from './PresetsScreen'

function renderPresetsScreen(overrides: Partial<PresetsScreenProps> = {}) {
  const props: PresetsScreenProps = {
    keymap: DEFAULT_KEYMAP,
    onApplyKeymap: vi.fn(),
    ...overrides,
  }
  return { ...render(<PresetsScreen {...props} />), props }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('PresetsScreen', () => {
  it('renders the Presets heading', () => {
    renderPresetsScreen()

    expect(screen.getByRole('heading', { name: /presets/i })).toBeInTheDocument()
  })

  it('saves the current draft settings and keymap as a named preset', () => {
    renderPresetsScreen({ keymap: { ...DEFAULT_KEYMAP, position: 'g' } })

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    expect(screen.getByRole('option', { name: 'Warm-up (active)' })).toBeInTheDocument()
  })

  it('loads a saved preset, replacing the draft config and reporting the keymap', () => {
    const onApplyKeymap = vi.fn()
    renderPresetsScreen({ keymap: { ...DEFAULT_KEYMAP, position: 'g' }, onApplyKeymap })

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Hard mode' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))

    fireEvent.change(screen.getByLabelText(/select a preset/i), {
      target: { value: screen.getByRole('option', { name: /hard mode/i }).getAttribute('value') },
    })
    fireEvent.click(screen.getByRole('button', { name: /^load$/i }))

    expect(onApplyKeymap).toHaveBeenCalledWith({ ...DEFAULT_KEYMAP, position: 'g' })
  })

  it('restores the most recently saved preset on mount, including which preset is marked active', () => {
    const { unmount } = renderPresetsScreen()

    fireEvent.change(screen.getByLabelText(/preset name/i), { target: { value: 'Warm-up' } })
    fireEvent.click(screen.getByRole('button', { name: /save preset/i }))
    unmount()

    renderPresetsScreen()

    expect(screen.getByRole('option', { name: 'Warm-up (active)' })).toBeInTheDocument()
  })
})
