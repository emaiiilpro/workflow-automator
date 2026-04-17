import type { Priority } from '@/types'

export function priorityLabel(p: Priority): string {
  switch (p) {
    case 'low':
      return 'Низкий'
    case 'medium':
      return 'Средний'
    case 'high':
      return 'Высокий'
    default:
      return p
  }
}

export function priorityBadgeClass(p: Priority): string {
  switch (p) {
    case 'low':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'medium':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'high':
      return 'bg-rose-50 text-rose-800 border-rose-200'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}
