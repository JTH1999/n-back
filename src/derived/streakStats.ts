import type { SessionHistoryRecord } from '../persistence/historyStorage'

export interface StreakStats {
  currentStreak: number
  streakActiveToday: boolean
  todaysTotalTimeMs: number
  todaysSessionCount: number
}

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function computeStreakStats(history: SessionHistoryRecord[], now: Date = new Date()): StreakStats {
  const completedDays = new Set(history.map((record) => localDayKey(new Date(record.timestamp))))

  const todayKey = localDayKey(now)
  const streakActiveToday = completedDays.has(todayKey)

  const cursor = startOfLocalDay(now)
  if (!streakActiveToday) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let currentStreak = 0
  while (completedDays.has(localDayKey(cursor))) {
    currentStreak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  const todaysRecords = history.filter((record) => localDayKey(new Date(record.timestamp)) === todayKey)

  return {
    currentStreak,
    streakActiveToday,
    todaysSessionCount: todaysRecords.length,
    todaysTotalTimeMs: todaysRecords.reduce((sum, record) => sum + record.config.trialCount * record.config.trialLengthMs, 0),
  }
}
