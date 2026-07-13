import { useState } from 'react'
import { loadHistory } from '../persistence/historyStorage'
import { formatDate } from '../utils/formatDate'
import { Panel } from './Panel'
import { ScreenHeader } from './ScreenHeader'
import { TrendChart, type TrendPoint } from './TrendChart'

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

export function TrendsView() {
  const [history] = useState(() => loadHistory())

  const sessions = history.length
  const averageAccuracy =
    sessions === 0 ? 0 : Math.round((history.reduce((sum, record) => sum + record.summary.accuracy, 0) / sessions) * 100)
  const peakN = sessions === 0 ? 0 : Math.max(...history.map((record) => record.config.n))

  const data: TrendPoint[] = history.map((record) => ({
    date: formatDate(record.timestamp),
    accuracy: Math.round(record.summary.accuracy * 100),
    n: record.config.n,
  }))

  return (
    <section className="flex w-full max-w-[960px] flex-col gap-7">
      <ScreenHeader eyebrow="Progress" title="Trends" />

      <div className="grid grid-cols-3 gap-3.5">
        <KpiTile value={String(sessions)} label="Sessions" />
        <KpiTile value={`${averageAccuracy}%`} label="Avg accuracy" />
        <KpiTile value={String(peakN)} label="Peak level" />
      </div>

      {sessions === 0 ? (
        <p className="text-sm text-dim">No completed sessions yet.</p>
      ) : (
        <Panel>
          <TrendChart data={data} />
        </Panel>
      )}
    </section>
  )
}
