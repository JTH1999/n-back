export const GRID_SIZE = 9
export type GridPosition = number

export const SHAPE_VALUES = ['circle', 'square', 'triangle', 'diamond'] as const
export type Shape = (typeof SHAPE_VALUES)[number]

// Okabe-Ito colorblind-safe palette: distinguishable by hue and luminance, not hue alone.
export const COLOR_VALUES = ['blue', 'orange', 'yellow', 'vermillion', 'purple', 'green'] as const
export type Color = (typeof COLOR_VALUES)[number]

export const COLOR_BG_CLASS: Record<Color, string> = {
  blue: 'bg-[#0072B2]',
  orange: 'bg-[#E69F00]',
  yellow: 'bg-[#F0E442]',
  vermillion: 'bg-[#D55E00]',
  purple: 'bg-[#CC79A7]',
  green: 'bg-[#009E73]',
}

export const LETTER_VALUES = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'] as const
export type Letter = (typeof LETTER_VALUES)[number]

export interface StreamValueMap {
  position: GridPosition
  shape: Shape
  color: Color
  letter: Letter
}

export type StreamKind = keyof StreamValueMap

export const STREAM_KINDS: readonly StreamKind[] = ['position', 'shape', 'color', 'letter']

export const STREAM_VALUE_POOLS: { [K in StreamKind]: readonly StreamValueMap[K][] } = {
  position: Array.from({ length: GRID_SIZE }, (_, cell) => cell),
  shape: SHAPE_VALUES,
  color: COLOR_VALUES,
  letter: LETTER_VALUES,
}

export const CENTER_CELL: GridPosition = Math.floor(GRID_SIZE / 2)

export interface StimulusDisplay {
  cell: GridPosition
  shape: Shape | null
  color: Color | null
}
