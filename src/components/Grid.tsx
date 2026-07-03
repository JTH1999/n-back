import clsx from 'clsx'
import { COLOR_BG_CLASS, GRID_SIZE, type Color, type GridPosition, type Shape } from '../engine/streams'

const CELL_COUNT = GRID_SIZE

const SHAPE_CLASS: Record<Shape, string> = {
  circle: 'rounded-full',
  square: '',
  triangle: '[clip-path:polygon(50%_0%,0%_100%,100%_100%)]',
  diamond: 'rotate-45',
}

export interface StimulusDisplay {
  cell: GridPosition
  shape: Shape | null
  color: Color | null
}

export interface GridProps {
  stimulus: StimulusDisplay | null
}

export function Grid({ stimulus }: GridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 w-64 h-64">
      {Array.from({ length: CELL_COUNT }, (_, cell) => {
        const isActive = stimulus !== null && stimulus.cell === cell
        return (
          <div
            key={cell}
            data-testid={`grid-cell-${cell}`}
            className={clsx(
              !isActive && 'rounded bg-slate-200 dark:bg-slate-700',
              isActive && (stimulus.shape ? SHAPE_CLASS[stimulus.shape] : 'rounded'),
              isActive && (stimulus.color ? COLOR_BG_CLASS[stimulus.color] : 'bg-blue-500'),
            )}
          />
        )
      })}
    </div>
  )
}
