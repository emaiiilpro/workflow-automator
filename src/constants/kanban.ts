import type { TaskColumn } from '@/types'

/** Колонки Kanban слева направо (индекс = порядок «вперёд») */
export const KANBAN_COLUMNS: { id: TaskColumn; title: string }[] = [
  { id: 'assigned', title: 'Назначенные' },
  { id: 'in_progress', title: 'В работе' },
  { id: 'completed', title: 'Выполненные' },
]

export function columnIndex(column: TaskColumn): number {
  return KANBAN_COLUMNS.findIndex((c) => c.id === column)
}

/** Разрешён только переход «вправо» по колонкам (без возврата назад) */
export function canMoveColumn(from: TaskColumn, to: TaskColumn): boolean {
  return columnIndex(to) > columnIndex(from)
}
