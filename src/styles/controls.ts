export const BORDERED_CONTROL_CLASS = 'rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800'

export const TEXT_INPUT_CLASS = `${BORDERED_CONTROL_CLASS} w-full bg-panel2 px-3 py-2.5 font-mono text-sm`

export const GHOST_BUTTON_CLASS =
  'rounded-lg border border-border px-4 py-2.5 font-mono text-[13px] hover:border-dim'

export const RANGE_INPUT_CLASS =
  'h-1 w-full appearance-none rounded-full bg-border disabled:opacity-50 ' +
  '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none ' +
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-panel [&::-webkit-slider-thumb]:bg-accent ' +
  '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full ' +
  '[&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-panel [&::-moz-range-thumb]:bg-accent'

export const EYEBROW_CLASS = 'font-mono text-[11px] tracking-[0.2em] text-dim uppercase'

// Three-tier accuracy coloring shared by the results screen and history log.
export function accuracyTextClass(accuracy: number): string {
  if (accuracy >= 0.8) return 'text-accent'
  if (accuracy >= 0.6) return 'text-warning'
  return 'text-danger'
}
