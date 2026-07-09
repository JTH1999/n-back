import { useState } from 'react'
import clsx from 'clsx'
import { BORDERED_CONTROL_CLASS } from '../styles/controls'

export interface SavePresetPanelProps {
  currentSummary: string
  onSave: (name: string) => void
}

export function SavePresetPanel({ currentSummary, onSave }: SavePresetPanelProps) {
  const [name, setName] = useState('')

  const handleSave = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    onSave(trimmedName)
    setName('')
  }

  return (
    <div className="rounded-xl border border-border bg-panel p-[18px]">
      <span className="font-mono text-[11px] tracking-[0.2em] text-dim uppercase">
        Save current config
      </span>
      <p className="mt-2 mb-3 font-mono text-xs text-dim">{currentSummary}</p>
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Preset name…"
        aria-label="Preset name"
        className={clsx(BORDERED_CONTROL_CLASS, 'w-full bg-panel2 px-3 py-2.5 font-mono text-sm')}
      />
      <button
        type="button"
        disabled={!name.trim()}
        onClick={handleSave}
        className="mt-3 w-full rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-fg disabled:cursor-not-allowed disabled:bg-panel disabled:text-dim2"
      >
        Save Preset
      </button>
    </div>
  )
}
