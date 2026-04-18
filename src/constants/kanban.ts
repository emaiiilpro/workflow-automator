import type { BaseTaskColumn, TaskColumn } from '@/types'

/** Колонки Kanban слева направо (индекс = порядок «вперёд») */
export const KANBAN_COLUMNS: { id: BaseTaskColumn; title: string }[] = [
  { id: 'assigned', title: 'Назначенные' },
  { id: 'in_progress', title: 'В работе' },
  { id: 'completed', title: 'Выполненные' },
]

export function columnIndex(column: TaskColumn): number {
  return KANBAN_COLUMNS.findIndex((c) => c.id === column)
}

/** Разрешены переносы в обе стороны между разными колонками */
export function canMoveColumn(from: TaskColumn, to: TaskColumn): boolean {
  return from !== to
}
