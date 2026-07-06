import type { SessionSummary as Summary } from '../engine/sessionEngine'

export interface SessionSummaryProps {
  summary: Summary
  onRestart: () => void
}

export function SessionSummary({ summary, onRestart }: SessionSummaryProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-semibold">Session complete</h2>
      <div className="flex flex-col items-center gap-1">
        <p className="text-4xl font-bold">{Math.round(summary.accuracy * 100)}%</p>
        <p className="text-sm text-slate-500">Overall accuracy</p>
      </div>
      <div className="flex w-full flex-col gap-4">
        {Object.values(summary.streams).map((streamSummary) => (
          <div key={streamSummary.kind} className="flex flex-col items-center gap-1">
            <h3 className="font-medium capitalize">{streamSummary.kind}</h3>
            <p className="text-sm text-slate-500">
              {Math.round(streamSummary.accuracy * 100)}% accuracy
            </p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <dt>Hits</dt>
              <dd>{streamSummary.hits}</dd>
              <dt>Misses</dt>
              <dd>{streamSummary.misses}</dd>
              <dt>False alarms</dt>
              <dd>{streamSummary.falseAlarms}</dd>
              <dt>Correct rejections</dt>
              <dd>{streamSummary.correctRejections}</dd>
            </dl>
          </div>
        ))}
      </div>
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
