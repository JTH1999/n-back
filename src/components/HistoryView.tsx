import { useState } from 'react'
import type { ResolvedTheme } from '../config/theme'
import { loadHistory } from '../persistence/historyStorage'
import { TrendChart, type TrendPoint } from './TrendChart'

export interface HistoryViewProps {
  onBack: () => void
  resolvedTheme: ResolvedTheme
}

export function HistoryView({ onBack, resolvedTheme }: HistoryViewProps) {
  const [history] = useState(() => loadHistory())

  const trendData: TrendPoint[] = history.map((record) => ({
    date: new Date(record.timestamp).toLocaleDateString(),
    accuracy: Math.round(record.summary.accuracy * 100),
    n: record.config.n,
  }))

  return (
    <div className="flex w-full flex-col gap-6">
      {history.length === 0 ? (
        <p className="text-sm text-slate-500">No completed sessions yet.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">Trends</h2>
            <TrendChart data={trendData} resolvedTheme={resolvedTheme} />
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
                    className="flex flex-col rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
                  >
                    <span>{new Date(record.timestamp).toLocaleString()}</span>
                    <span className="capitalize text-slate-500 dark:text-slate-400">
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
