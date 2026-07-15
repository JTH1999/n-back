import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { StreakStats } from '../derived/streakStats'
import { formatDuration } from '../utils/formatDuration'
import { FlameIcon } from './FlameIcon'
import { SubHeading } from './SubHeading'

export interface NavItem<TId extends string> {
  id: TId
  label: string
}

export interface AppShellProps<TId extends string> {
  navItems: NavItem<TId>[]
  activeId: TId
  onNavigate: (id: TId) => void
  streak: StreakStats
  children: ReactNode
}

function SidebarStreak({ streak }: { streak: StreakStats }) {
  return (
    <div className="hidden shell:mt-auto shell:flex shell:flex-col shell:gap-2">
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
      className="flex items-center gap-1.5 ml-auto shell:hidden"
      role="group"
      aria-label="Streak and today's session count"
    >
      <FlameIcon filled={streak.streakActiveToday} className="h-4 w-4" />
      <span className="font-mono text-sm font-semibold">{streak.currentStreak}</span>
      <span className="font-mono text-xs text-dim">· {streak.todaysSessionCount}</span>
    </div>
  )
}

function NavButton<TId extends string>({
  item,
  isActive,
  onNavigate,
  className,
}: {
  item: NavItem<TId>
  isActive: boolean
  onNavigate: (id: TId) => void
  className: string
}) {
  return (
    <button
      type="button"
      aria-current={isActive ? 'page' : undefined}
      onClick={() => onNavigate(item.id)}
      className={clsx(
        'font-mono text-[13px] tracking-[0.04em] transition-colors',
        className,
        isActive ? 'bg-accent text-accent-fg' : 'text-dim hover:bg-panel hover:text-fg',
      )}
    >
      {item.label}
    </button>
  )
}

function TabBar<TId extends string>({
  navItems,
  activeId,
  onNavigate,
}: {
  navItems: NavItem<TId>[]
  activeId: TId
  onNavigate: (id: TId) => void
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex min-h-[56px] border-t border-border bg-panel2 pb-[env(safe-area-inset-bottom)] shell:hidden"
      aria-label="Main mobile"
    >
      {navItems.map((item) => (
        <NavButton
          key={item.id}
          item={item}
          isActive={item.id === activeId}
          onNavigate={onNavigate}
          className="flex flex-1 items-center justify-center"
        />
      ))}
    </nav>
  )
}

export function AppShell<TId extends string>({
  navItems,
  activeId,
  onNavigate,
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
        <nav className="hidden flex-1 shell:flex shell:flex-col shell:gap-1" aria-label="Main">
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={item.id === activeId}
              onNavigate={onNavigate}
              className="text-left rounded-lg px-3 py-2.5"
            />
          ))}
        </nav>
        <TopBarStreak streak={streak} />
        <SidebarStreak streak={streak} />
      </aside>
      <main className="flex-1 overflow-x-hidden min-w-0 p-6 pb-[calc(56px+env(safe-area-inset-bottom)+24px)] shell:p-[34px_40px_60px]">
        <div className="mx-auto max-w-[960px]">{children}</div>
      </main>
      <TabBar navItems={navItems} activeId={activeId} onNavigate={onNavigate} />
    </div>
  )
}
