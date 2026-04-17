import { isBefore, parseISO, startOfDay } from 'date-fns'

/** true, если дедлайн раньше сегодня (без учёта времени) */
export function isOverdue(deadlineIsoDate: string): boolean {
  try {
    const d = startOfDay(parseISO(deadlineIsoDate))
    const today = startOfDay(new Date())
    return isBefore(d, today)
  } catch {
    return false
  }
}
