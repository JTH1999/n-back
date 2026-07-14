import clsx from 'clsx'
import type { StreakStats } from '../derived/streakStats'
import type { SessionSummary as Summary, StreamSummary } from '../engine/sessionEngine'
import { STREAM_DOT_CLASS } from '../engine/streams'
import { accuracyTextClass } from '../styles/controls'
import { Button } from './Button'
import { FlameIcon } from './FlameIcon'
import { Panel } from './Panel'
import { ScreenHeader } from './ScreenHeader'
import { SubHeading } from './SubHeading'
import { TwoColumnLayout } from './TwoColumnLayout'

export interface AdaptiveRecommendation {
  n: number
  note: 'increased' | 'decreased' | 'held steady'
}

export interface SessionSummaryProps {
  summary: Summary
  n: number
  trialCount: number
  recommendation: AdaptiveRecommendation | null
  streak: StreakStats | null
  onRetry: () => void
  onDone: () => void
}

interface StreakBadgeProps {
  streak: StreakStats
}

function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg bg-panel2 px-3 py-1.5"
      role="group"
      aria-label="Day streak"
    >
      <FlameIcon filled={streak.streakActiveToday} className="h-5 w-5" />
      <span className="font-mono text-lg font-semibold">{streak.currentStreak}</span>
      <span className="text-[9px] tracking-[0.08em] text-dim uppercase">Day streak</span>
    </div>
  )
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-panel2 px-1 py-2">
      <span className="font-mono text-lg font-semibold">{value}</span>
      <span className="mt-0.5 text-center text-[9px] tracking-[0.08em] text-dim uppercase">{label}</span>
    </div>
  )
}

function ResultCard({ streamSummary }: { streamSummary: StreamSummary }) {
  const accuracyPercent = Math.round(streamSummary.accuracy * 100)

  return (
    <Panel>
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={clsx('h-2.5 w-2.5 flex-none rounded-full', STREAM_DOT_CLASS[streamSummary.kind])}
        />
        <span className="text-[15px] font-semibold capitalize">{streamSummary.kind}</span>
        <span className="ml-auto font-mono font-semibold">{accuracyPercent}%</span>
      </div>
      <div className="my-3.5 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className={clsx('h-full rounded-full', STREAM_DOT_CLASS[streamSummary.kind])}
          style={{ width: `${accuracyPercent}%` }}
        />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <StatTile value={streamSummary.hits} label="Hits" />
        <StatTile value={streamSummary.misses} label="Misses" />
        <StatTile value={streamSummary.falseAlarms} label="False alarms" />
        <StatTile value={streamSummary.correctRejections} label="Correct rejections" />
      </div>
    </Panel>
  )
}

export function SessionSummary({
  summary,
  n,
  trialCount,
  recommendation,
  streak,
  onRetry,
  onDone,
}: SessionSummaryProps) {
  const accuracyPercent = Math.round(summary.accuracy * 100)

  return (
    <section className="flex w-full max-w-[960px] flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <ScreenHeader eyebrow="Complete · saved to history" title="Session Results" />
        <div className="flex items-center gap-4">
          {streak && <StreakBadge streak={streak} />}
          <div className="flex gap-2.5">
            <Button variant="ghost" onClick={onRetry}>
              Retry
            </Button>
            <Button onClick={onDone}>Done →</Button>
          </div>
        </div>
      </div>

      <TwoColumnLayout
        sideFirst
        side={
          <Panel>
            <div className="text-center">
              <SubHeading>Overall accuracy</SubHeading>
              <p
                className={clsx(
                  'mt-3 font-mono text-[64px] leading-none font-semibold',
                  accuracyTextClass(summary.accuracy),
                )}
              >
                {accuracyPercent}
                <span className="text-2xl text-dim">%</span>
              </p>
              <p className="mt-1.5 font-mono text-xs text-dim">
                N={n} · {trialCount} trials
              </p>
            </div>
            {recommendation && (
              <div className="mt-5 border-t border-border pt-[18px] text-left">
                <SubHeading>Adaptive</SubHeading>
                <p className="mt-2 text-sm">
                  Next session → <b className="font-semibold text-accent">N = {recommendation.n}</b> ·{' '}
                  {recommendation.note}
                </p>
              </div>
            )}
          </Panel>
        }
        main={
          <div className="grid grid-cols-1 gap-3.5 shell:grid-cols-2">
            {Object.values(summary.streams).map((streamSummary) => (
              <ResultCard key={streamSummary.kind} streamSummary={streamSummary} />
            ))}
          </div>
        }
      />
    </section>
  )
}
