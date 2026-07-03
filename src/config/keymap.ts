import type { StreamKind } from '../engine/streams'

export const STREAM_KEYMAP = {
  position: 'a',
  shape: 's',
  color: 'd',
  letter: 'f',
} as const satisfies Record<StreamKind, string>
