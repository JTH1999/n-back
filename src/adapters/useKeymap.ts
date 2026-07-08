import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_KEYMAP, rebindKeymap, type Keymap } from '../config/keymap'
import type { StreamKind } from '../engine/streams'
import { loadKeymap, saveKeymap } from '../persistence/keymapStorage'

export interface UseKeymapResult {
  keymap: Keymap
  rebind: (kind: StreamKind, key: string) => void
}

export function useKeymap(): UseKeymapResult {
  const [keymap, setKeymap] = useState<Keymap>(() => ({
    ...DEFAULT_KEYMAP,
    ...loadKeymap(),
  }))

  useEffect(() => {
    saveKeymap(keymap)
  }, [keymap])

  const rebind = useCallback((kind: StreamKind, key: string) => {
    setKeymap((current) => rebindKeymap(current, kind, key))
  }, [])

  return { keymap, rebind }
}
