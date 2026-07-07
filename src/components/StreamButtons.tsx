import type { StreamKind } from '../engine/streams'

export interface StreamButtonsProps {
  activeStreams: readonly StreamKind[]
  onAssert: (kind: StreamKind) => void
}

export function StreamButtons({ activeStreams, onAssert }: StreamButtonsProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-md justify-center gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {activeStreams.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => onAssert(kind)}
            className="flex-1 min-w-0 max-w-32 px-2 py-3 min-h-12 rounded-lg bg-blue-500 text-sm font-medium capitalize text-white active:bg-blue-600"
          >
            {kind}
          </button>
        ))}
      </div>
    </div>
  )
}
