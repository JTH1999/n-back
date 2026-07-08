import { useState } from 'react'
import { loadHistory } from '../persistence/historyStorage'
import { TrendChart } from './TrendChart'

export interface HistoryViewProps {
  onBack: () => void
}

export function HistoryView({ onBack }: HistoryViewProps) {
  const [history] = useState(() => loadHistory())

  return (
    <div className="flex w-full flex-col gap-6">
      {history.length === 0 ? (
        <p className="text-sm text-slate-500">No completed sessions yet.</p>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Trends</h2>
            <TrendChart
              label="Accuracy"
              values={history.map((record) => record.summary.accuracy)}
              formatValue={(value) => `${Math.round(value * 100)}%`}
            />
            <TrendChart
              label="N-back level"
              values={history.map((record) => record.config.n)}
              formatValue={(value) => String(value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">Past sessions</h2>
            <ul className="flex flex-col gap-2">
              {history
                .slice()
                .reverse()
                .map((record) => (
                  <li
                    key={record.timestamp}
                    className="flex flex-col rounded border px-3 py-2 text-sm"
                  >
                    <span>{new Date(record.timestamp).toLocaleString()}</span>
                    <span className="capitalize text-slate-500">
                      N={record.config.n} · {record.config.streams.join(', ')}
                    </span>
                    <span>{Math.round(record.summary.accuracy * 100)}% accuracy</span>
                  </li>
                ))}
            </ul>
          </div>
        </>
      )}
      <button
        type="button"
        onClick={onBack}
        className="rounded bg-blue-500 px-4 py-2 text-white"
      >
        Back
      </button>
    </div>
  )
}
