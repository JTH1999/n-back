import clsx from 'clsx'
import { useState } from 'react'
import { loadHistory, type SessionHistoryRecord } from '../persistence/historyStorage'
import { accuracyTextClass, EYEBROW_CLASS } from '../styles/controls'
import { Panel } from './Panel'
import { ScreenHeader } from './ScreenHeader'

const ROW_CLASS = 'grid grid-cols-[90px_1fr_60px_72px_64px] items-center gap-3 py-3 text-sm'

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function HistoryRow({ record }: { record: SessionHistoryRecord }) {
  const accuracyPercent = Math.round(record.summary.accuracy * 100)

  return (
    <div className={clsx(ROW_CLASS, 'border-b border-border text-sm last:border-none')} role="row">
      <span className="font-mono text-dim" role="cell">
        {formatDate(record.timestamp)}
      </span>
      <span className="capitalize" role="cell">
        {record.config.streams.join(', ')}
      </span>
      <span className="font-mono" role="cell">
        N={record.config.n}
      </span>
      <span className="font-mono text-dim" role="cell">
        {record.summary.totalTrials}
      </span>
      <span className={clsx('text-right font-mono', accuracyTextClass(record.summary.accuracy))} role="cell">
        {accuracyPercent}%
      </span>
    </div>
  )
}

export function HistoryView() {
  const [history] = useState(() => loadHistory())
  const rows = history.slice().reverse()

  return (
    <section className="flex w-full max-w-[960px] flex-col gap-7">
      <div className="flex items-end justify-between gap-4">
        <ScreenHeader eyebrow="Log" title="History" />
        <span className="font-mono text-sm text-dim">{history.length} sessions</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-dim">No completed sessions yet.</p>
      ) : (
        <Panel>
          <div role="table">
            <div
              className={clsx(ROW_CLASS, EYEBROW_CLASS, 'border-b border-border py-2.5')}
              role="row"
            >
              <span role="columnheader">Date</span>
              <span role="columnheader">Streams</span>
              <span role="columnheader">N</span>
              <span role="columnheader">Trials</span>
              <span className="text-right" role="columnheader">
                Acc
              </span>
            </div>
            {rows.map((record) => (
              <HistoryRow key={record.timestamp} record={record} />
            ))}
          </div>
        </Panel>
      )}
    </section>
  )
}
