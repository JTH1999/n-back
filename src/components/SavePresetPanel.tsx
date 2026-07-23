import { useState } from 'react'
import { TEXT_INPUT_CLASS } from '../styles/controls'
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
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            handleSave()
          }
        }}
        placeholder="Preset name…"
        aria-label="Preset name"
        className={TEXT_INPUT_CLASS}
      />
      <Button disabled={!name.trim()} onClick={handleSave} className="mt-3 w-full">
        Save Preset
      </Button>
    </Panel>
  )
}
