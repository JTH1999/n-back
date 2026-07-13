import clsx from 'clsx'
import {
  COLOR_BG_CLASS,
  STREAM_DOT_CLASS,
  STREAM_TEXT_CLASS,
  STREAM_VALUE_POOLS,
  type StreamKind,
} from '../engine/streams'

const STREAM_PREVIEW_LABEL: Record<StreamKind, string> = {
  position: 'positions',
  shape: 'shapes',
  color: 'colors',
  letter: 'letters',
}

function StreamPreview({ kind, active }: { kind: StreamKind; active: boolean }) {
  return (
    <div
      className={clsx(
        'flex h-13 items-center justify-center transition-opacity',
        !active && 'opacity-30 grayscale',
      )}
    >
      {kind === 'position' && (
        <div className="grid h-11 w-11 grid-cols-3 gap-[3px]">
          {Array.from({ length: 9 }, (_, cell) => (
            <span
              key={cell}
              className={clsx('rounded-sm', cell === 4 ? STREAM_DOT_CLASS.position : 'bg-border')}
            />
          ))}
        </div>
      )}
      {kind === 'shape' && (
        <div
          className={clsx(
            'h-9 w-9 [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]',
            STREAM_DOT_CLASS.shape,
          )}
        />
      )}
      {kind === 'color' && (
        <div className="flex gap-1.5">
          <span className={clsx('h-8 w-3 rounded', COLOR_BG_CLASS.blue)} />
          <span className={clsx('h-8 w-3 rounded', COLOR_BG_CLASS.orange)} />
          <span className={clsx('h-8 w-3 rounded', COLOR_BG_CLASS.green)} />
        </div>
      )}
      {kind === 'letter' && (
        <div className={clsx('flex items-center gap-2', STREAM_TEXT_CLASS.letter)}>
          <b className="font-mono text-xl font-semibold">K</b>
          <span className="flex h-[34px] items-center gap-[3px]">
            <i className="h-[40%] w-1 rounded-sm bg-current" />
            <i className="h-[78%] w-1 rounded-sm bg-current" />
            <i className="h-full w-1 rounded-sm bg-current" />
            <i className="h-[56%] w-1 rounded-sm bg-current" />
          </span>
        </div>
      )}
    </div>
  )
}

export interface StreamCardProps {
  kind: StreamKind
  active: boolean
  onToggle: () => void
}

export function StreamCard({ kind, active, onToggle }: StreamCardProps) {
  return (
    <label
      className={clsx(
        'flex cursor-pointer flex-col gap-1 rounded-[14px] border bg-panel p-3.5 transition-colors hover:border-dim',
        active ? 'border-accent' : 'border-border',
      )}
    >
      <input type="checkbox" className="sr-only" checked={active} onChange={onToggle} />
      <StreamPreview kind={kind} active={active} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-semibold capitalize">{kind}</span>
        <span
          aria-hidden="true"
          className={clsx(
            'relative h-[18px] w-[30px] flex-none rounded-full transition-colors',
            active ? 'bg-accent' : 'bg-border',
          )}
        >
          <span
            className={clsx(
              'absolute top-[2px] left-[2px] h-[14px] w-[14px] rounded-full bg-white transition-transform',
              active && 'translate-x-3',
            )}
          />
        </span>
      </div>
      <span className="font-mono text-[11px] text-dim">
        {STREAM_VALUE_POOLS[kind].length} {STREAM_PREVIEW_LABEL[kind]}
      </span>
    </label>
  )
}
