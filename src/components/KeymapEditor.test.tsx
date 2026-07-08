import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_KEYMAP } from '../config/keymap'
import { KeymapEditor } from './KeymapEditor'

describe('KeymapEditor', () => {
  it('shows the current key binding for each stream', () => {
    render(<KeymapEditor keymap={DEFAULT_KEYMAP} onRebind={vi.fn()} />)

    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('S')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
    expect(screen.getByText('F')).toBeInTheDocument()
  })

  it('captures the next keypress after pressing rebind and reports it', () => {
    const onRebind = vi.fn()
    render(<KeymapEditor keymap={DEFAULT_KEYMAP} onRebind={onRebind} />)

    fireEvent.click(screen.getByRole('button', { name: /rebind position/i }))
    fireEvent.keyDown(window, { key: 'g' })

    expect(onRebind).toHaveBeenCalledWith('position', 'g')
  })

  it('shows a listening prompt while waiting for a key', () => {
    render(<KeymapEditor keymap={DEFAULT_KEYMAP} onRebind={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /rebind shape/i }))

    expect(screen.getByText(/press a key/i)).toBeInTheDocument()
  })

  it('cancels listening when Escape is pressed', () => {
    const onRebind = vi.fn()
    render(<KeymapEditor keymap={DEFAULT_KEYMAP} onRebind={onRebind} />)

    fireEvent.click(screen.getByRole('button', { name: /rebind color/i }))
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onRebind).not.toHaveBeenCalled()
    expect(screen.queryByText(/press a key/i)).not.toBeInTheDocument()
  })

  it('ignores modifier-only keys while listening', () => {
    const onRebind = vi.fn()
    render(<KeymapEditor keymap={DEFAULT_KEYMAP} onRebind={onRebind} />)

    fireEvent.click(screen.getByRole('button', { name: /rebind letter/i }))
    fireEvent.keyDown(window, { key: 'Shift' })
    fireEvent.keyDown(window, { key: 'g' })

    expect(onRebind).toHaveBeenCalledWith('letter', 'g')
  })
})
