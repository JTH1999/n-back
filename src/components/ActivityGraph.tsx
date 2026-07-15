import clsx from 'clsx'
import { Fragment, useMemo, useState } from 'react'
import { computeActivityGraph, GRID_ROWS, type ActivityDay } from '../derived/activityGraph'
import type { SessionHistoryRecord } from '../persistence/historyStorage'
import { EYEBROW_CLASS } from '../styles/controls'
import { formatDuration } from '../utils/formatDuration'
import { SegmentedControl } from './SegmentedControl'

type ActivityMetric = 'sessions' | 'time'

const METRIC_LABELS: Record<ActivityMetric, string> = { sessions: 'Session count', time: 'Total time' }

// Shading is relative to a fixed reference (20 sessions / 20 minutes) rather than the visible grid's max,
// so a day's color stays meaningful across different history windows.
const METRIC_REFERENCE_MAX: Record<ActivityMetric, number> = { sessions: 20, time: 20 * 60 * 1000 }

function metricValue(day: ActivityDay, metric: ActivityMetric): number {
  return metric === 'sessions' ? day.sessionCount : day.totalTimeMs
}

// Zero maps to the lowest step; the rest are quartiles of the metric's reference max.
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

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Row index 0 = Sunday; only label every other day to avoid crowding the axis.
const DAY_ROW_LABELS: Record<number, string> = { 1: 'Mon', 3: 'Wed', 5: 'Fri' }

// A week gets a month label when it contains the 1st, or (for the leftmost week) always,
// so the grid never starts unlabeled. Skips a label if the same month was just labeled.
function computeMonthLabels(weeks: ActivityDay[][]): (string | null)[] {
  let lastLabeledMonth = -1
  return weeks.map((week, i) => {
    const firstOfMonth = week.find((day) => day.date.getDate() === 1)
    const month = firstOfMonth ? firstOfMonth.date.getMonth() : i === 0 ? week[0].date.getMonth() : null
    if (month === null || month === lastLabeledMonth) return null
    lastLabeledMonth = month
    return MONTH_LABELS[month]
  })
}

function describeDay(day: ActivityDay, metric: ActivityMetric): string {
  const dateLabel = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (day.sessionCount === 0) return `${dateLabel}: no sessions`
  if (metric === 'sessions') return `${dateLabel}: ${day.sessionCount} session${day.sessionCount === 1 ? '' : 's'}`
  return `${dateLabel}: ${formatDuration(day.totalTimeMs)} practiced`
}

export interface ActivityGraphProps {
  history: SessionHistoryRecord[]
  now?: Date
}

export function ActivityGraph({ history, now }: ActivityGraphProps) {
  const [metric, setMetric] = useState<ActivityMetric>('sessions')
  const weeks = useMemo(() => computeActivityGraph(history, now), [history, now])
  const monthLabels = useMemo(() => computeMonthLabels(weeks), [weeks])
  const max = METRIC_REFERENCE_MAX[metric]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className={EYEBROW_CLASS}>Activity</span>
        <SegmentedControl
          options={(Object.keys(METRIC_LABELS) as ActivityMetric[]).map((value) => ({ value, label: METRIC_LABELS[value] }))}
          value={metric}
          onChange={setMetric}
          ariaLabel="Activity metric"
          size="sm"
          surface="panel2"
        />
      </div>

      <div className="grid w-full grid-cols-[auto_repeat(53,minmax(6px,1fr))] grid-rows-[auto_repeat(7,1fr)] gap-[3px] overflow-x-auto pb-1">
        <div />
        {monthLabels.map((label, weekIndex) => (
          <div key={weekIndex} className="whitespace-nowrap text-[9px] leading-[10px] text-dim">
            {label ?? ''}
          </div>
        ))}

        {Array.from({ length: GRID_ROWS }, (_, row) => (
          <Fragment key={row}>
            <div className="pr-1 text-[9px] leading-[10px] text-dim">{DAY_ROW_LABELS[row] ?? ''}</div>
            {weeks.map((week) => {
              const day = week[row]
              const level = intensityLevel(metricValue(day, metric), max)
              return (
                <div
                  key={day.dateKey}
                  title={describeDay(day, metric)}
                  data-level={level}
                  className={clsx('aspect-square w-full rounded-[2px]', LEVEL_CLASS[level])}
                />
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
