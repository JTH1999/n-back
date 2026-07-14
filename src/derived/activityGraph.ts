import { localDayKey, startOfLocalDay } from './localDay'
import { sessionDurationMs } from './sessionDuration'
import type { SessionHistoryRecord } from '../persistence/historyStorage'

export const GRID_WEEKS = 53
export const GRID_ROWS = 7

export interface ActivityDay {
  dateKey: string
  date: Date
  sessionCount: number
  totalTimeMs: number
}

export function computeActivityGraph(history: SessionHistoryRecord[], now: Date = new Date()): ActivityDay[][] {
  const dayStats = new Map<string, { sessionCount: number; totalTimeMs: number }>()
  for (const record of history) {
    const key = localDayKey(new Date(record.timestamp))
    const entry = dayStats.get(key) ?? { sessionCount: 0, totalTimeMs: 0 }
    entry.sessionCount += 1
    entry.totalTimeMs += sessionDurationMs(record.config.trialCount, record.config.trialLengthMs)
    dayStats.set(key, entry)
  }

  const currentWeekStart = startOfLocalDay(now)
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay())

  const gridStart = new Date(currentWeekStart)
  gridStart.setDate(gridStart.getDate() - (GRID_WEEKS - 1) * GRID_ROWS)

  const cursor = new Date(gridStart)
  const weeks: ActivityDay[][] = []
  for (let week = 0; week < GRID_WEEKS; week++) {
    const days: ActivityDay[] = []
    for (let day = 0; day < GRID_ROWS; day++) {
      const key = localDayKey(cursor)
      const stats = dayStats.get(key) ?? { sessionCount: 0, totalTimeMs: 0 }
      days.push({ dateKey: key, date: new Date(cursor), ...stats })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(days)
  }

  return weeks
}
