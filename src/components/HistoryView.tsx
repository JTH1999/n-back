import clsx from 'clsx'
import { useState } from 'react'
import { loadHistory, type SessionHistoryRecord } from '../persistence/historyStorage'
import { accuracyTextClass, EYEBROW_CLASS } from '../styles/controls'
import { formatDate } from '../utils/formatDate'
import { Panel } from './Panel'
import { ScreenHeader } from './ScreenHeader'
import { TrendChart, type TrendPoint } from './TrendChart'

const ROW_CLASS = 'grid grid-cols-[90px_1fr_60px_72px_64px] items-center gap-3 py-3 text-sm'

function KpiTile({ value, label }: { value: string; label: string }) {
  return (
    <Panel>
      <div role="group" aria-label={label}>
        <p className="font-mono text-[32px] font-semibold">{value}</p>
        <p className="mt-1 font-mono text-[11px] tracking-[0.2em] text-dim uppercase">{label}</p>
      </div>
    </Panel>
  )
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
        {record.config.trialCount}
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

  const sessions = history.length
  const averageAccuracy =
    sessions === 0 ? 0 : Math.round((history.reduce((sum, record) => sum + record.summary.accuracy, 0) / sessions) * 100)
  const peakN = sessions === 0 ? 0 : Math.max(...history.map((record) => record.config.n))

  const trendData: TrendPoint[] = history.map((record) => ({
    date: formatDate(record.timestamp),
    accuracy: Math.round(record.summary.accuracy * 100),
    n: record.config.n,
  }))

  return (
    <section className="flex w-full max-w-[960px] flex-col gap-7">
      <div className="flex items-end justify-between gap-4">
        <ScreenHeader eyebrow="Log" title="History" />
        <span className="font-mono text-sm text-dim">{sessions} sessions</span>
      </div>

      {sessions === 0 ? (
        <p className="text-sm text-dim">No completed sessions yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3.5">
            <KpiTile value={String(sessions)} label="Sessions" />
            <KpiTile value={`${averageAccuracy}%`} label="Avg accuracy" />
            <KpiTile value={String(peakN)} label="Peak level" />
          </div>

          <Panel>
            <TrendChart data={trendData} />
          </Panel>

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
        </>
      )}
    </section>
  )
}
