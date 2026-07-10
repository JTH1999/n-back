import clsx from 'clsx'
import { COLOR_BG_CLASS, GRID_SIZE, type Shape, type StimulusDisplay } from '../engine/streams'

const CELL_COUNT = GRID_SIZE

const SHAPE_CLASS: Record<Shape, string> = {
  circle: 'rounded-full',
  square: 'rounded-lg',
  triangle: '[clip-path:polygon(50%_4%,96%_96%,4%_96%)]',
  diamond: '[clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]',
}

export interface GridProps {
  stimulus: StimulusDisplay | null
}

export function Grid({ stimulus }: GridProps) {
  return (
    <div className="grid aspect-square w-[min(74vw,380px)] grid-cols-3 gap-3">
      {Array.from({ length: CELL_COUNT }, (_, cell) => {
        const isActive = stimulus !== null && stimulus.cell === cell
        return (
          <div
            key={cell}
            data-testid={`grid-cell-${cell}`}
            className={clsx(
              'flex items-center justify-center rounded-[14px] border bg-panel2 transition-colors',
              isActive ? 'border-dim2' : 'border-border',
            )}
          >
            {isActive && (
              <div
                className={clsx(
                  'h-[62%] w-[62%]',
                  stimulus.shape ? SHAPE_CLASS[stimulus.shape] : 'rounded-lg',
                  stimulus.color ? COLOR_BG_CLASS[stimulus.color] : 'bg-tile',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
