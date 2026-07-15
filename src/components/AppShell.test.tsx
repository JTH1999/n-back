import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { StreakStats } from '../derived/streakStats'
import { AppShell, type NavItem } from './AppShell'

type ScreenId = 'train' | 'history'

const NAV_ITEMS: NavItem<ScreenId>[] = [
  { id: 'train', label: 'Train' },
  { id: 'history', label: 'History' },
]

const streak: StreakStats = {
  currentStreak: 4,
  streakActiveToday: true,
  todaysTotalTimeMs: 125_000,
  todaysSessionCount: 3,
}

function renderShell(streakOverride: StreakStats = streak) {
  const onNavigate = vi.fn()
  render(
    <AppShell
      navItems={NAV_ITEMS}
      activeId="train"
      onNavigate={onNavigate}
      streak={streakOverride}
    >
      <p>Content</p>
    </AppShell>,
  )
  return { onNavigate }
}

describe('AppShell streak display', () => {
  it('shows streak, today\'s time, and today\'s session count in the wide sidebar', () => {
    renderShell()

    const wide = screen.getByRole('group', { name: "Streak and today's stats" })
    expect(within(wide).getByText('4')).toBeInTheDocument()
    expect(within(wide).getByText('2m 5s')).toBeInTheDocument()
    expect(within(wide).getByText('3 today')).toBeInTheDocument()
  })

  it("shows streak and today's session count but omits today's time in the mobile top bar", () => {
    renderShell()

    const mobile = screen.getByRole('group', { name: "Streak and today's session count" })
    expect(within(mobile).getByText('4')).toBeInTheDocument()
    expect(within(mobile).getByText('· 3')).toBeInTheDocument()
    expect(within(mobile).queryByText(/2m 5s/)).not.toBeInTheDocument()
  })

  it('renders an outlined flame when no session has completed today', () => {
    renderShell({ ...streak, streakActiveToday: false })

    const wide = screen.getByRole('group', { name: "Streak and today's stats" })
    expect(within(wide).getByRole('img', { hidden: true })).toHaveAttribute('fill', 'none')
  })

  it('renders a filled flame once a session has completed today', () => {
    renderShell({ ...streak, streakActiveToday: true })

    const wide = screen.getByRole('group', { name: "Streak and today's stats" })
    expect(within(wide).getByRole('img', { hidden: true })).toHaveAttribute('fill', 'currentColor')
  })
})

describe('AppShell navigation', () => {
  it('still navigates and highlights the active item alongside the streak display', () => {
    const { onNavigate } = renderShell()
    const sidebar = screen.getByRole('navigation', { name: 'Main' })

    fireEvent.click(within(sidebar).getByRole('button', { name: 'History' }))

    expect(onNavigate).toHaveBeenCalledWith('history')
    expect(within(sidebar).getByRole('button', { name: 'Train' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})

describe('AppShell mobile tab bar', () => {
  it('renders all nav items in the mobile tab bar', () => {
    renderShell()
    const tabBar = screen.getByRole('navigation', { name: 'Main mobile' })

    expect(within(tabBar).getByRole('button', { name: 'Train' })).toBeInTheDocument()
    expect(within(tabBar).getByRole('button', { name: 'History' })).toBeInTheDocument()
  })

  it('calls onNavigate with the right id when a tab is clicked', () => {
    const { onNavigate } = renderShell()
    const tabBar = screen.getByRole('navigation', { name: 'Main mobile' })

    fireEvent.click(within(tabBar).getByRole('button', { name: 'History' }))

    expect(onNavigate).toHaveBeenCalledWith('history')
  })

  it('marks the active tab with aria-current', () => {
    renderShell()
    const tabBar = screen.getByRole('navigation', { name: 'Main mobile' })

    expect(within(tabBar).getByRole('button', { name: 'Train' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(tabBar).getByRole('button', { name: 'History' })).not.toHaveAttribute(
      'aria-current',
    )
  })
})
