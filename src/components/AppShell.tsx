import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { ThemeOverride } from '../config/theme'
import type { StreakStats } from '../derived/streakStats'
import { formatDuration } from '../utils/formatDuration'
import { FlameIcon } from './FlameIcon'
import { SubHeading } from './SubHeading'
import { ThemeToggle } from './ThemeToggle'

export interface NavItem<TId extends string> {
  id: TId
  label: string
}

export interface AppShellProps<TId extends string> {
  navItems: NavItem<TId>[]
  activeId: TId
  onNavigate: (id: TId) => void
  themeOverride: ThemeOverride | null
  onChangeTheme: (theme: ThemeOverride | null) => void
  streak: StreakStats
  children: ReactNode
}

function SidebarStreak({ streak }: { streak: StreakStats }) {
  return (
    <div className="hidden shell:flex shell:flex-col shell:gap-2">
      <SubHeading>streak</SubHeading>
      <div
        className="flex flex-col gap-2 rounded-lg bg-panel p-3"
        role="group"
        aria-label="Streak and today's stats"
      >
        <div className="flex items-center gap-2">
          <FlameIcon filled={streak.streakActiveToday} className="h-5 w-5" />
          <span className="font-mono text-lg font-semibold">{streak.currentStreak}</span>
          <span className="text-[9px] tracking-[0.08em] text-dim uppercase">Day streak</span>
        </div>
        <div className="flex justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <SubHeading>time</SubHeading>
            <span className="font-mono text-xs text-dim">{formatDuration(streak.todaysTotalTimeMs)}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <SubHeading>sessions</SubHeading>
            <span className="font-mono text-xs text-dim">{streak.todaysSessionCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TopBarStreak({ streak }: { streak: StreakStats }) {
  return (
    <div
      className="flex items-center gap-1.5 shell:hidden"
      role="group"
      aria-label="Streak and today's session count"
    >
      <FlameIcon filled={streak.streakActiveToday} className="h-4 w-4" />
      <span className="font-mono text-sm font-semibold">{streak.currentStreak}</span>
      <span className="font-mono text-xs text-dim">· {streak.todaysSessionCount}</span>
    </div>
  )
}

export function AppShell<TId extends string>({
  navItems,
  activeId,
  onNavigate,
  themeOverride,
  onChangeTheme,
  streak,
  children,
}: AppShellProps<TId>) {
  return (
    <div className="flex flex-col min-h-screen bg-bg text-fg shell:flex-row">
      <aside className="flex flex-row items-center gap-3.5 p-4 border-b border-border bg-panel2 shell:sticky shell:top-0 shell:h-screen shell:w-[216px] shell:shrink-0 shell:flex-col shell:items-stretch shell:gap-6 shell:border-b-0 shell:border-r shell:p-[22px_16px]">
        <div className="flex items-center gap-2.5 font-mono text-sm font-semibold tracking-[0.14em]">
          <span className="text-lg text-accent">◫</span>
          <span>N-BACK</span>
        </div>
        <nav className="flex flex-1 flex-row flex-wrap gap-1 shell:flex-col" aria-label="Main">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={item.id === activeId ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                'text-left rounded-lg px-3 py-2.5 font-mono text-[13px] tracking-[0.04em] transition-colors',
                item.id === activeId
                  ? 'bg-accent text-accent-fg'
                  : 'text-dim hover:bg-panel hover:text-fg',
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <TopBarStreak streak={streak} />
        <div className="flex items-center gap-2 shell:mt-auto shell:flex-col shell:items-stretch shell:gap-4">
          <SidebarStreak streak={streak} />
          <SubHeading className="hidden shell:block">theme</SubHeading>
          <ThemeToggle override={themeOverride} onChange={onChangeTheme} variant="compact" />
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden min-w-0 p-6 shell:p-[34px_40px_60px]">
        <div className="mx-auto max-w-[960px]">{children}</div>
      </main>
    </div>
  )
}
