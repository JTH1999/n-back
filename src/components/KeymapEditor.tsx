import { useEffect, useState } from 'react'
import clsx from 'clsx'
import type { Keymap } from '../config/keymap'
import { STREAM_KINDS, type StreamKind } from '../engine/streams'
import { SubHeading } from './SubHeading'

export interface KeymapEditorProps {
  keymap: Keymap
  onRebind: (kind: StreamKind, key: string) => void
}

// Per-stream identity colors, matching the design's STREAMS palette (used for stream cards,
// results dots, and keymap rows alike) — distinct from the `color` stream's own swatch values.
const STREAM_DOT_CLASS: Record<StreamKind, string> = {
  position: 'bg-[#56B4E9]',
  shape: 'bg-[#5fbf8a]',
  color: 'bg-[#e0a030]',
  letter: 'bg-[#c98bbf]',
}

const KEYCAP_BASE_CLASS =
  'w-16 flex-none rounded-md border border-b-[3px] bg-panel2 py-2 text-center font-mono'

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
    <fieldset className="flex flex-col gap-2.5">
      <SubHeading as="legend" className="mb-1">
        Key bindings
      </SubHeading>
      {STREAM_KINDS.map((kind) => (
        <div key={kind} className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={clsx('h-2.5 w-2.5 flex-none rounded-full', STREAM_DOT_CLASS[kind])}
          />
          <span className="flex-1 text-sm font-medium capitalize">{kind}</span>
          {listeningFor === kind ? (
            <button
              type="button"
              aria-label={`Rebind ${kind}`}
              className={clsx(KEYCAP_BASE_CLASS, 'border-accent text-[11px] text-accent')}
            >
              Press a key…
            </button>
          ) : (
            <button
              type="button"
              aria-label={`Rebind ${kind}`}
              onClick={() => setListeningFor(kind)}
              className={clsx(KEYCAP_BASE_CLASS, 'border-border text-sm hover:border-dim')}
            >
              {keymap[kind].toUpperCase()}
            </button>
          )}
        </div>
      ))}
    </fieldset>
  )
}
