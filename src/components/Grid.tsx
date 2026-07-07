import clsx from 'clsx'
import { COLOR_BG_CLASS, GRID_SIZE, type Shape, type StimulusDisplay } from '../engine/streams'

const CELL_COUNT = GRID_SIZE

const SHAPE_CLASS: Record<Shape, string> = {
  circle: 'rounded-full',
  square: '',
  triangle: '[clip-path:polygon(50%_0%,0%_100%,100%_100%)]',
  diamond: 'rotate-45 scale-[0.7071]',
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
            className="relative rounded bg-slate-200 dark:bg-slate-700"
          >
            {isActive && (
              <div
                className={clsx(
                  'absolute inset-0',
                  stimulus.shape ? SHAPE_CLASS[stimulus.shape] : 'rounded',
                  stimulus.color ? COLOR_BG_CLASS[stimulus.color] : 'bg-blue-500',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
