import type { GridPosition } from '../engine/sessionEngine'

const CELL_COUNT = 9

export interface GridProps {
  activeCell: GridPosition | null
}

export function Grid({ activeCell }: GridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 w-64 h-64">
      {Array.from({ length: CELL_COUNT }, (_, cell) => (
        <div
          key={cell}
          data-testid={`grid-cell-${cell}`}
          className={
            cell === activeCell
              ? 'rounded bg-blue-500'
              : 'rounded bg-slate-200 dark:bg-slate-700'
          }
        />
      ))}
    </div>
  )
}
