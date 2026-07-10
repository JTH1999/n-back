import { useState } from 'react'
import clsx from 'clsx'
import { BORDERED_CONTROL_CLASS } from '../styles/controls'
import { Button } from './Button'
import { Panel } from './Panel'
import { SubHeading } from './SubHeading'

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
    <Panel>
      <SubHeading>Save current config</SubHeading>
      <p className="mt-2 mb-3 font-mono text-xs text-dim">{currentSummary}</p>
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Preset name…"
        aria-label="Preset name"
        className={clsx(BORDERED_CONTROL_CLASS, 'w-full bg-panel2 px-3 py-2.5 font-mono text-sm')}
      />
      <Button disabled={!name.trim()} onClick={handleSave} className="mt-3 w-full">
        Save Preset
      </Button>
    </Panel>
  )
}
