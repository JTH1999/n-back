import { useEffect, useState } from 'react'
import clsx from 'clsx'
import type { Keymap } from '../config/keymap'
import { STREAM_KINDS, type StreamKind } from '../engine/streams'
import { BORDERED_CONTROL_CLASS } from '../styles/controls'

export interface KeymapEditorProps {
  keymap: Keymap
  onRebind: (kind: StreamKind, key: string) => void
}

export function KeymapEditor({ keymap, onRebind }: KeymapEditorProps) {
  const [listeningFor, setListeningFor] = useState<StreamKind | null>(null)

  useEffect(() => {
    if (!listeningFor) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setListeningFor(null)
        return
      }
      if (event.key.length !== 1) return

      onRebind(listeningFor, event.key)
      setListeningFor(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [listeningFor, onRebind])

  return (
    <fieldset className="flex flex-col gap-2">
      <legend>Keymap</legend>
      {STREAM_KINDS.map((kind) => (
        <div key={kind} className="flex items-center justify-between gap-4">
          <span className="capitalize">{kind}</span>
          {listeningFor === kind ? (
            <span className="text-sm text-slate-500">Press a key…</span>
          ) : (
            <>
              <kbd>{keymap[kind].toUpperCase()}</kbd>
              <button
                type="button"
                onClick={() => setListeningFor(kind)}
                className={clsx(BORDERED_CONTROL_CLASS, 'px-2 py-1 text-sm')}
              >
                Rebind {kind}
              </button>
            </>
          )}
        </div>
      ))}
    </fieldset>
  )
}
