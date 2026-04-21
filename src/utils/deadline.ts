import { format, isBefore, parse, parseISO, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'

/** Дата дедлайна в локальной полуночи по строке yyyy-MM-dd */
export function parseDeadlineLocal(deadline: string): Date {
  try {
    return parse(deadline, 'yyyy-MM-dd', new Date())
  } catch {
    return parseISO(deadline)
  }
}

/** Просрочено: для даты без времени — календарный день раньше сегодня; с временем — после этого момента */
export function isOverdue(deadlineIsoDate: string, dueTime?: string): boolean {
  try {
    const d = parseDeadlineLocal(deadlineIsoDate)
    const now = new Date()
    if (dueTime && /^\d{1,2}:\d{2}$/.test(dueTime)) {
      const [hh, mm] = dueTime.split(':').map((x) => Number(x))
      const dueEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, 59, 999)
      return dueEnd < now
    }
    const day = startOfDay(d)
    return isBefore(day, startOfDay(now))
  } catch {
    return false
  }
}

/** Нормализация времени из поля ввода: '' — сброс; undefined — неверный формат */
export function normalizeDueTimeFromInput(s: string): string | '' | undefined {
  const t = s.trim()
  if (!t) return ''
  const m = t.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return undefined
  const hh = Number(m[1])
  const mm = Number(m[2])
  if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return undefined
  }
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function formatDeadlineDisplay(deadline: string, dueTime?: string): string {
  try {
    const d = parseDeadlineLocal(deadline)
    if (dueTime && /^\d{1,2}:\d{2}$/.test(dueTime)) {
      const [h, m] = dueTime.split(':').map((x) => Number(x))
      const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m)
      return `${format(dt, 'd MMM yyyy', { locale: ru })}\u00a0·\u00a0${format(dt, 'HH:mm', { locale: ru })}`
    }
    return format(d, 'd MMM yyyy', { locale: ru })
  } catch {
    return deadline
  }
}
