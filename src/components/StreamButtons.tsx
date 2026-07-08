import clsx from 'clsx'
import type { TrialOutcome } from '../engine/sessionEngine'
import type { StreamKind } from '../engine/streams'

export interface StreamButtonsProps {
  activeStreams: readonly StreamKind[]
  pressedStreams: ReadonlySet<StreamKind>
  feedback?: Partial<Record<StreamKind, TrialOutcome>>
  onAssert: (kind: StreamKind) => void
}

function isCorrectOutcome(outcome: TrialOutcome): boolean {
  return outcome === 'hit' || outcome === 'correct-rejection'
}

export function StreamButtons({
  activeStreams,
  pressedStreams,
  feedback,
  onAssert,
}: StreamButtonsProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-md justify-center gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {activeStreams.map((kind) => {
          const outcome = feedback?.[kind]
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onAssert(kind)}
              className={clsx(
                'relative flex-1 min-w-0 max-w-32 px-2 py-3 min-h-12 rounded-lg bg-blue-500 text-sm font-medium capitalize text-white active:bg-blue-600',
                'outline outline-4 outline-offset-2 transition-colors',
                pressedStreams.has(kind)
                  ? 'outline-slate-900 dark:outline-white'
                  : 'outline-transparent',
              )}
            >
              {kind}
              {outcome && (
                <span
                  data-testid={`feedback-${kind}`}
                  aria-hidden="true"
                  className={clsx(
                    'absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900',
                    isCorrectOutcome(outcome) ? 'bg-green-500' : 'bg-red-500',
                  )}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
