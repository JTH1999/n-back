import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { computeContributionGraph, type ContributionDay } from '../derived/contributionGraph'
import type { SessionHistoryRecord } from '../persistence/historyStorage'
import { EYEBROW_CLASS } from '../styles/controls'
import { formatDuration } from '../utils/formatDuration'
import { SegmentedControl } from './SegmentedControl'

type ContributionMetric = 'sessions' | 'time'

const METRIC_LABELS: Record<ContributionMetric, string> = { sessions: 'Session count', time: 'Total time' }

function metricValue(day: ContributionDay, metric: ContributionMetric): number {
  return metric === 'sessions' ? day.sessionCount : day.totalTimeMs
}

// Zero maps to the lowest step; the rest are quartiles of the metric's max across the visible grid.
function intensityLevel(value: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0 || max <= 0) return 0
  const ratio = value / max
  if (ratio > 0.75) return 4
  if (ratio > 0.5) return 3
  if (ratio > 0.25) return 2
  return 1
}

const LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-border',
  1: 'bg-accent/25',
  2: 'bg-accent/50',
  3: 'bg-accent/75',
  4: 'bg-accent',
}

function describeDay(day: ContributionDay, metric: ContributionMetric): string {
  const dateLabel = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (day.sessionCount === 0) return `${dateLabel}: no sessions`
  if (metric === 'sessions') return `${dateLabel}: ${day.sessionCount} session${day.sessionCount === 1 ? '' : 's'}`
  return `${dateLabel}: ${formatDuration(day.totalTimeMs)} practiced`
}

export interface ContributionGraphProps {
  history: SessionHistoryRecord[]
  now?: Date
}

export function ContributionGraph({ history, now }: ContributionGraphProps) {
  const [metric, setMetric] = useState<ContributionMetric>('sessions')
  const weeks = useMemo(() => computeContributionGraph(history, now), [history, now])
  const max = Math.max(0, ...weeks.flat().map((day) => metricValue(day, metric)))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className={EYEBROW_CLASS}>Contributions</span>
        <SegmentedControl
          options={(Object.keys(METRIC_LABELS) as ContributionMetric[]).map((value) => ({ value, label: METRIC_LABELS[value] }))}
          value={metric}
          onChange={setMetric}
          ariaLabel="Contribution metric"
          size="sm"
          surface="panel2"
        />
      </div>

      <div className="grid grid-flow-col grid-rows-7 gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week) =>
          week.map((day) => {
            const level = intensityLevel(metricValue(day, metric), max)
            return (
              <div
                key={day.dateKey}
                title={describeDay(day, metric)}
                data-level={level}
                className={clsx('h-[10px] w-[10px] rounded-[2px]', LEVEL_CLASS[level])}
              />
            )
          }),
        )}
      </div>
    </div>
  )
}
