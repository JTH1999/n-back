import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { ThemeOverride } from '../config/theme'
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
  children: ReactNode
}

export function AppShell<TId extends string>({
  navItems,
  activeId,
  onNavigate,
  themeOverride,
  onChangeTheme,
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
        <div className="flex items-center gap-2 shell:mt-auto shell:flex-col shell:items-stretch">
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
