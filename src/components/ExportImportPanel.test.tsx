import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EXPORT_FORMAT_VERSION } from '../persistence/exportImport'
import { loadHistory } from '../persistence/historyStorage'
import { ExportImportPanel } from './ExportImportPanel'

const validPayload = {
  version: EXPORT_FORMAT_VERSION,
  exportedAt: '2026-07-08T12:00:00.000Z',
  history: [
    {
      id: 'record-1',
      timestamp: '2026-07-08T12:00:00.000Z',
      config: {
        n: 2,
        trialCount: 20,
        streams: ['position'],
        displayDurationMs: 500,
        trialLengthMs: 2500,
        volume: 1,
        muted: false,
        liveFeedback: false,
        adaptive: { enabled: false, lowerThreshold: 0.5, upperThreshold: 0.8 },
      },
      summary: { totalTrials: 20, accuracy: 0.9, streams: {} },
    },
  ],
  presets: [],
  lastPresetId: null,
  draftSettings: null,
  keymap: null,
}

function fileFor(content: string) {
  return new File([content], 'backup.json', { type: 'application/json' })
}

beforeEach(() => {
  window.localStorage.clear()
  window.URL.createObjectURL = vi.fn(() => 'blob:mock')
  window.URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ExportImportPanel', () => {
  it('exports the current state as a downloaded JSON file', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<ExportImportPanel />)

    fireEvent.click(screen.getByRole('button', { name: /export data/i }))

    expect(window.URL.createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(window.URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('imports a valid file after confirmation and notifies the caller', async () => {
    const onImported = vi.fn()
    const confirmImport = vi.fn(() => true)
    render(<ExportImportPanel onImported={onImported} confirmImport={confirmImport} />)

    fireEvent.change(screen.getByLabelText(/import file/i), {
      target: { files: [fileFor(JSON.stringify(validPayload))] },
    })

    await waitFor(() => expect(onImported).toHaveBeenCalled())
    expect(confirmImport).toHaveBeenCalled()
    expect(loadHistory()).toEqual(validPayload.history)
  })

  it('does not apply the import when the user cancels the confirmation', async () => {
    const onImported = vi.fn()
    const confirmImport = vi.fn(() => false)
    render(<ExportImportPanel onImported={onImported} confirmImport={confirmImport} />)

    fireEvent.change(screen.getByLabelText(/import file/i), {
      target: { files: [fileFor(JSON.stringify(validPayload))] },
    })

    await waitFor(() => expect(confirmImport).toHaveBeenCalled())
    expect(onImported).not.toHaveBeenCalled()
    expect(loadHistory()).toEqual([])
  })

  it('shows an error and leaves existing data untouched when the file is not valid JSON', async () => {
    window.localStorage.setItem('n-back:session-history', JSON.stringify(validPayload.history))
    const onImported = vi.fn()
    const confirmImport = vi.fn(() => true)
    render(<ExportImportPanel onImported={onImported} confirmImport={confirmImport} />)

    fireEvent.change(screen.getByLabelText(/import file/i), {
      target: { files: [fileFor('not json')] },
    })

    expect(await screen.findByText(/not valid json/i)).toBeInTheDocument()
    expect(confirmImport).not.toHaveBeenCalled()
    expect(onImported).not.toHaveBeenCalled()
    expect(loadHistory()).toEqual(validPayload.history)
  })

  it('shows an error when the file is well-formed JSON but an incompatible shape', async () => {
    render(<ExportImportPanel confirmImport={() => true} />)

    fireEvent.change(screen.getByLabelText(/import file/i), {
      target: { files: [fileFor(JSON.stringify({ foo: 'bar' }))] },
    })

    expect(await screen.findByText(/backup/i)).toBeInTheDocument()
  })
})
