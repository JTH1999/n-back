import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigForm } from './ConfigForm'

beforeEach(() => {
  window.localStorage.clear()
})

describe('ConfigForm', () => {
  it('starts a session with the default draft settings', () => {
    const onStart = vi.fn()
    render(<ConfigForm onStart={onStart} />)

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))

    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ n: 2, trialCount: 20, streams: ['position'] }),
    )
  })

  it('rejects starting a session with zero active streams', () => {
    const onStart = vi.fn()
    render(<ConfigForm onStart={onStart} />)

    fireEvent.click(screen.getByLabelText(/position/i))

    expect(screen.getByText(/select at least one stream/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /start session/i }))
    expect(onStart).not.toHaveBeenCalled()
  })

  it('persists changed settings to localStorage and restores them on next mount', () => {
    const { unmount } = render(<ConfigForm onStart={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/n-back level/i), { target: { value: '5' } })
    fireEvent.click(screen.getByLabelText(/letter/i))
    fireEvent.click(screen.getByLabelText(/mute/i))
    unmount()

    render(<ConfigForm onStart={vi.fn()} />)

    expect(screen.getByLabelText(/n-back level/i)).toHaveValue(5)
    expect(screen.getByLabelText(/letter/i)).toBeChecked()
    expect(screen.getByLabelText(/mute/i)).toBeChecked()
  })

  it('disables the volume slider while muted', () => {
    render(<ConfigForm onStart={vi.fn()} />)

    fireEvent.click(screen.getByLabelText(/mute/i))

    expect(screen.getByLabelText(/volume/i)).toBeDisabled()
  })

  it('fills in missing fields from defaults when the saved draft is from an older schema', () => {
    window.localStorage.setItem('n-back:draft-settings', JSON.stringify({ n: 4 }))

    render(<ConfigForm onStart={vi.fn()} />)

    expect(screen.getByLabelText(/n-back level/i)).toHaveValue(4)
    expect(screen.getByLabelText(/volume/i)).not.toBeDisabled()
    expect(screen.getByLabelText(/mute/i)).not.toBeChecked()
  })
})
