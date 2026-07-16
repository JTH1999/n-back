import { useState } from 'react'
import clsx from 'clsx'
import { BORDERED_CONTROL_CLASS } from '../styles/controls'
import { Button } from './Button'
import { Overlay } from './Overlay'

export interface PresetLoadConfirmDialogProps {
  targetPresetName: string
  onSaveAsNewAndLoad: (name: string) => void
  onDiscardAndLoad: () => void
  onCancel: () => void
}

export function PresetLoadConfirmDialog({
  targetPresetName,
  onSaveAsNewAndLoad,
  onDiscardAndLoad,
  onCancel,
}: PresetLoadConfirmDialogProps) {
  const [name, setName] = useState('')

  const handleSaveAsNewAndLoad = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    onSaveAsNewAndLoad(trimmedName)
  }

  return (
    <Overlay role="alertdialog" ariaLabel="Confirm preset load">
      <h2 className="text-[22px] font-semibold">Unsaved changes</h2>
      <p className="text-sm text-dim">
        Your current settings have drifted from the active preset. Loading "{targetPresetName}" will
        replace them.
      </p>
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            handleSaveAsNewAndLoad()
          }
        }}
        placeholder="New preset name…"
        aria-label="New preset name"
        className={clsx(BORDERED_CONTROL_CLASS, 'w-full bg-panel2 px-3 py-2.5 font-mono text-sm')}
      />
      <div className="mt-3 flex w-full flex-col gap-2.5">
        <Button disabled={!name.trim()} onClick={handleSaveAsNewAndLoad}>
          Save as new preset & load
        </Button>
        <Button variant="ghost" onClick={onDiscardAndLoad}>
          Discard and load
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Overlay>
  )
}
