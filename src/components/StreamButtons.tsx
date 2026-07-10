import clsx from 'clsx'
import type { Keymap } from '../config/keymap'
import type { TrialOutcome } from '../engine/sessionEngine'
import { STREAM_BORDER_TOP_CLASS, type StreamKind } from '../engine/streams'

export interface StreamButtonsProps {
  activeStreams: readonly StreamKind[]
  pressedStreams: ReadonlySet<StreamKind>
  keymap: Keymap
  feedback?: Partial<Record<StreamKind, TrialOutcome>>
  onAssert: (kind: StreamKind) => void
}

type FlashState = 'ack' | 'correct' | 'wrong'

function isCorrectOutcome(outcome: TrialOutcome): boolean {
  return outcome === 'hit' || outcome === 'correct-rejection'
}

function flashState(
  outcome: TrialOutcome | undefined,
  pressed: boolean,
): FlashState | undefined {
  if (outcome) return isCorrectOutcome(outcome) ? 'correct' : 'wrong'
  if (pressed) return 'ack'
  return undefined
}

const FLASH_CLASS: Record<FlashState, string> = {
  ack: 'border-accent shadow-[0_0_0_1px_var(--accent)]',
  correct: 'border-success bg-success/15',
  wrong: 'border-danger bg-danger/15',
}

export function StreamButtons({
  activeStreams,
  pressedStreams,
  keymap,
  feedback,
  onAssert,
}: StreamButtonsProps) {
  return (
    <div className="mt-auto flex w-full flex-wrap gap-3">
      {activeStreams.map((kind) => {
        const flash = flashState(feedback?.[kind], pressedStreams.has(kind))
        return (
          <button
            key={kind}
            type="button"
            data-feedback={flash}
            onClick={() => onAssert(kind)}
            className={clsx(
              'flex min-w-[130px] flex-1 flex-col items-center gap-1.5 rounded-xl border border-t-[3px] border-border bg-panel p-3.5 transition-colors active:scale-[0.97]',
              STREAM_BORDER_TOP_CLASS[kind],
              flash && FLASH_CLASS[flash],
            )}
          >
            <span className="rounded-[5px] border border-b-2 border-border bg-panel2 px-1.5 py-0.5 font-mono text-[11px] text-dim">
              {keymap[kind].toUpperCase()}
            </span>
            <span className="text-[13px] font-medium capitalize">{kind} match</span>
          </button>
        )
      })}
    </div>
  )
}
