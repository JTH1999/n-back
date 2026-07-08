import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { SessionRunnerConfig } from '../adapters/useSessionRunner'
import { SessionRunner } from './SessionRunner'

const config: SessionRunnerConfig = {
  n: 1,
  trialCount: 5,
  streams: ['position'],
  displayDurationMs: 60_000,
  trialLengthMs: 60_000,
  volume: 1,
  muted: true,
}

describe('SessionRunner keyboard handling', () => {
  it('asserts a match for the stream bound to the pressed key', () => {
    render(
      <SessionRunner
        config={config}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    expect(screen.getByText('G')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'g' })

    expect(screen.getByRole('button', { name: /position/i }).className).toContain(
      'outline-slate-900',
    )
  })

  it('ignores keys not present in the keymap', () => {
    render(
      <SessionRunner
        config={config}
        keymap={{ position: 'g', shape: 's', color: 'd', letter: 'f' }}
        onRestart={vi.fn()}
      />,
    )

    fireEvent.keyDown(window, { key: 'a' })

    expect(screen.getByRole('button', { name: /position/i }).className).toContain(
      'outline-transparent',
    )
  })
})
