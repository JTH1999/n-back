import { useState } from 'react'
import clsx from 'clsx'
import type { Preset } from '../adapters/usePresets'
import { BORDERED_CONTROL_CLASS } from '../styles/controls'

export interface PresetManagerProps {
  presets: Preset[]
  activePresetId: string | null
  onSave: (name: string) => void
  onLoad: (id: string) => void
}

export function PresetManager({ presets, activePresetId, onSave, onLoad }: PresetManagerProps) {
  const [name, setName] = useState('')
  const [selectedId, setSelectedId] = useState('')

  const handleSave = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    onSave(trimmedName)
    setName('')
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend>Presets</legend>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Preset name"
          aria-label="Preset name"
          className={clsx(BORDERED_CONTROL_CLASS, 'flex-1 px-2 py-1')}
        />
        <button
          type="button"
          disabled={!name.trim()}
          onClick={handleSave}
          className={clsx(BORDERED_CONTROL_CLASS, 'px-2 py-1 text-sm disabled:opacity-50')}
        >
          Save preset
        </button>
      </div>
      {presets.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            aria-label="Select a preset"
            className={clsx(BORDERED_CONTROL_CLASS, 'flex-1 px-2 py-1')}
          >
            <option value="" disabled>
              Select a preset…
            </option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
                {preset.id === activePresetId ? ' (active)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedId}
            onClick={() => onLoad(selectedId)}
            className={clsx(BORDERED_CONTROL_CLASS, 'px-2 py-1 text-sm disabled:opacity-50')}
          >
            Load
          </button>
        </div>
      )}
    </fieldset>
  )
}
