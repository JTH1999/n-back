import { useRef, useState } from 'react'
import clsx from 'clsx'
import {
  ImportValidationError,
  applyExportedState,
  buildExportPayload,
  parseExportedState,
} from '../persistence/exportImport'
import { BORDERED_CONTROL_CLASS } from '../styles/controls'

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
    <fieldset className="flex flex-col gap-2">
      <legend>Backup</legend>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          className={clsx(BORDERED_CONTROL_CLASS, 'px-2 py-1 text-sm')}
        >
          Export data
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={clsx(BORDERED_CONTROL_CLASS, 'px-2 py-1 text-sm')}
        >
          Import data
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          aria-label="Import file"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </fieldset>
  )
}
