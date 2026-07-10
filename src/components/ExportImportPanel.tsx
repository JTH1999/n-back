import { useRef, useState } from 'react'
import {
  ImportValidationError,
  applyExportedState,
  buildExportPayload,
  parseExportedState,
} from '../persistence/exportImport'
import { Button } from './Button'
import { SubHeading } from './SubHeading'

export interface ExportImportPanelProps {
  onImported?: () => void
  confirmImport?: (message: string) => boolean
}

const IMPORT_CONFIRM_MESSAGE =
  'Importing will replace all current session history, presets, and settings with the contents of this file. Continue?'

export function ExportImportPanel({
  onImported = () => window.location.reload(),
  confirmImport = (message) => window.confirm(message),
}: ExportImportPanelProps) {
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const payload = buildExportPayload()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `n-back-backup-${payload.exportedAt.slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError(null)
    try {
      const text = await file.text()
      const state = parseExportedState(text)
      if (!confirmImport(IMPORT_CONFIRM_MESSAGE)) return
      applyExportedState(state)
      onImported()
    } catch (err) {
      setError(err instanceof ImportValidationError ? err.message : 'Failed to import file.')
    }
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <SubHeading as="legend" className="mb-1">
        Backup
      </SubHeading>
      <p className="mt-0 text-[13px] text-dim">
        All data lives in this browser only. Export a JSON file or restore one.
      </p>
      <Button
        variant="ghost"
        onClick={handleExport}
        className="flex w-full items-center justify-center gap-2"
      >
        <span aria-hidden="true">↓</span>
        Export data
      </Button>
      <Button
        variant="ghost"
        onClick={() => fileInputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2"
      >
        <span aria-hidden="true">↑</span>
        Import data
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        aria-label="Import file"
        className="hidden"
        onChange={handleFileSelected}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </fieldset>
  )
}
