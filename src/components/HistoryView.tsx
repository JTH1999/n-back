import clsx from 'clsx'
import { useState, type ReactNode } from 'react'
import { computeStreakStats } from '../derived/streakStats'
import { useSessionHistory } from '../hooks/useSessionHistory'
import type { SessionHistoryRecord } from '../persistence/historyStorage'
import { accuracyTextClass, EYEBROW_CLASS } from '../styles/controls'
import { formatDate } from '../utils/formatDate'
import { formatDuration } from '../utils/formatDuration'
import { ActivityGraph } from './ActivityGraph'
import { FlameIcon } from './FlameIcon'
import { Panel } from './Panel'
import { ScreenHeader } from './ScreenHeader'
import { SegmentedControl } from './SegmentedControl'
import { TrendChart, type TrendPoint } from './TrendChart'

const ROW_CLASS = 'grid grid-cols-[90px_1fr_60px_72px_64px] items-center gap-3 py-3 text-sm'
const HISTORY_TABS = ['overview', 'log'] as const
type HistoryTab = (typeof HISTORY_TABS)[number]
const TAB_LABELS: Record<HistoryTab, string> = { overview: 'Overview', log: 'Log' }

interface KpiTileProps {
  value: string
  label: string
  icon?: ReactNode
}

function KpiTile({ value, label, icon }: KpiTileProps) {
  return (
    <Panel>
      <div role="group" aria-label={label}>
        <p className="flex items-center gap-2 font-mono text-[32px] font-semibold">
          {icon}
          {value}
        </p>
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
  const { history } = useSessionHistory()
  const [tab, setTab] = useState<HistoryTab>('overview')
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

  const streak = computeStreakStats(history)

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
          <SegmentedControl
            options={HISTORY_TABS.map((value) => ({ value, label: TAB_LABELS[value] }))}
            value={tab}
            onChange={setTab}
            ariaLabel="History"
            asTabs
            idPrefix="history"
            fill
          />

          {tab === 'overview' && (
            <div id="history-tabpanel-overview" role="tabpanel" aria-labelledby="history-tab-overview" className="flex flex-col gap-3.5">
              <div className="grid grid-cols-3 gap-3.5">
                <KpiTile value={String(sessions)} label="Sessions" />
                <KpiTile value={`${averageAccuracy}%`} label="Avg accuracy" />
                <KpiTile value={String(peakN)} label="Peak level" />
              </div>

              <Panel>
                <TrendChart data={trendData} />
              </Panel>

              <div className="grid grid-cols-3 gap-3.5">
                <KpiTile
                  value={String(streak.currentStreak)}
                  label="Day streak"
                  icon={<FlameIcon filled={streak.streakActiveToday} />}
                />
                <KpiTile value={formatDuration(streak.todaysTotalTimeMs)} label="Today's time" />
                <KpiTile value={String(streak.todaysSessionCount)} label="Today's sessions" />
              </div>

              <Panel>
                <ActivityGraph history={history} />
              </Panel>
            </div>
          )}

          {tab === 'log' && (
            <div id="history-tabpanel-log" role="tabpanel" aria-labelledby="history-tab-log">
              <Panel>
                <div className="overflow-x-auto">
                  <div role="table" className="min-w-[420px]">
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
                      <HistoryRow key={record.id} record={record} />
                    ))}
                  </div>
                </div>
              </Panel>
            </div>
          )}
        </>
      )}
    </section>
  )
}
