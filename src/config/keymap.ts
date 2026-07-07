import { STREAM_KINDS, type StreamKind } from '../engine/streams'

export type Keymap = Record<StreamKind, string>

export const DEFAULT_KEYMAP = {
  position: 'a',
  shape: 's',
  color: 'd',
  letter: 'f',
} as const satisfies Keymap

export function rebindKeymap(keymap: Keymap, kind: StreamKind, key: string): Keymap {
  const normalizedKey = key.toLowerCase()
  const previousKey = keymap[kind]
  if (normalizedKey === previousKey) return keymap

  const conflictingKind = STREAM_KINDS.find(
    (candidate) => candidate !== kind && keymap[candidate] === normalizedKey,
  )

  return {
    ...keymap,
    [kind]: normalizedKey,
    ...(conflictingKind ? { [conflictingKind]: previousKey } : {}),
  }
}
