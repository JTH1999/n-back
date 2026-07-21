import { useState } from 'react'
import clsx from 'clsx'
import type { Preset } from '../hooks/usePresets'
import { summarizePresetConfig } from '../config/presetSummary'
import { BORDERED_CONTROL_CLASS } from '../styles/controls'
import { Button } from './Button'

const PRESET_ROW_MAIN_CLASS = 'flex-1 min-w-[12rem]'

export interface PresetListProps {
  presets: Preset[]
  activePresetId: string | null
  isActiveModified?: boolean
  onLoad: (id: string) => void
  onRename?: (id: string, name: string) => void
  onDelete?: (id: string) => void
}

export function PresetList({
  presets,
  activePresetId,
  isActiveModified = false,
  onLoad,
  onRename,
  onDelete,
}: PresetListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')

  if (presets.length === 0) {
    return <p className="text-sm text-dim">No saved presets yet.</p>
  }

  const handleStartRename = (preset: Preset) => {
    setEditingId(preset.id)
    setDraftName(preset.name)
  }

  const handleCancelRename = () => {
    setEditingId(null)
    setDraftName('')
  }

  const handleCommitRename = () => {
    const trimmedName = draftName.trim()
    if (trimmedName && editingId) {
      onRename?.(editingId, trimmedName)
    }
    handleCancelRename()
  }

  return (
    <div className="flex flex-col gap-3">
      {presets.map((preset) => {
        const isEditing = editingId === preset.id
        const canEdit = !preset.readOnly
        return (
          <div
            key={preset.id}
            className={clsx(
              'flex flex-wrap items-center gap-3 rounded-xl border bg-panel p-[16px_18px]',
              preset.id === activePresetId ? 'border-accent' : 'border-border',
            )}
          >
            {isEditing ? (
              <input
                type="text"
                autoFocus
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleCommitRename()
                  } else if (event.key === 'Escape') {
                    event.preventDefault()
                    handleCancelRename()
                  }
                }}
                aria-label={`New name for ${preset.name}`}
                className={clsx(
                  BORDERED_CONTROL_CLASS,
                  PRESET_ROW_MAIN_CLASS,
                  'bg-panel2 px-3 py-2 font-mono text-sm',
                )}
              />
            ) : (
              <div className={PRESET_ROW_MAIN_CLASS}>
                <div className="text-[15px] font-semibold">
                  {preset.name}
                  {preset.readOnly && (
                    <span className="ml-2 font-mono text-[11px] tracking-[0.1em] text-dim uppercase">
                      Template
                    </span>
                  )}
                  {preset.id === activePresetId && (
                    <span className="ml-2 font-mono text-[11px] tracking-[0.1em] text-accent uppercase">
                      {isActiveModified ? 'Modified' : 'Active'}
                    </span>
                  )}
                </div>
                <div className="mt-[3px] truncate font-mono text-xs text-dim">
                  {summarizePresetConfig(preset.config)}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              {isEditing ? (
                <>
                  <Button variant="ghost" onClick={handleCommitRename}>
                    Save
                  </Button>
                  <Button variant="ghost" onClick={handleCancelRename}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => onLoad(preset.id)}>
                    Load
                  </Button>
                  {onRename && canEdit && (
                    <Button
                      variant="icon"
                      aria-label={`Rename ${preset.name}`}
                      onClick={() => handleStartRename(preset)}
                    >
                      ✎
                    </Button>
                  )}
                  {onDelete && canEdit && (
                    <Button
                      variant="icon"
                      aria-label={`Delete ${preset.name}`}
                      onClick={() => onDelete(preset.id)}
                    >
                      ✕
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
