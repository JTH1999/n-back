import type { SessionSummary as Summary } from '../engine/sessionEngine'

export interface SessionSummaryProps {
  summary: Summary
  onRestart: () => void
}

export function SessionSummary({ summary, onRestart }: SessionSummaryProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-semibold">Session complete</h2>
      <p className="text-4xl font-bold">{Math.round(summary.accuracy * 100)}%</p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <dt>Hits</dt>
        <dd>{summary.hits}</dd>
        <dt>Misses</dt>
        <dd>{summary.misses}</dd>
        <dt>False alarms</dt>
        <dd>{summary.falseAlarms}</dd>
        <dt>Correct rejections</dt>
        <dd>{summary.correctRejections}</dd>
      </dl>
      <button
        type="button"
        onClick={onRestart}
        className="rounded bg-blue-500 px-4 py-2 text-white"
      >
        Back to setup
      </button>
    </div>
  )
}
