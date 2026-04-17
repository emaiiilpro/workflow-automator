import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { Calendar, Check, Flag, GripVertical, Pencil } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import toast from 'react-hot-toast'
import type { Priority, Task, User } from '@/types'
import { priorityBadgeClass, priorityLabel } from '@/utils/priority'
import { isOverdue } from '@/utils/deadline'
import { AvatarStack } from '@/components/ui/AvatarStack'
import { useAppDispatch } from '@/store/hooks'
import { setAssigneeCompleted, setTaskColumn, updateTask } from '@/store/slices/tasksSlice'
import { KANBAN_COLUMNS } from '@/constants/kanban'

type Props = {
  task: Task
  index: number
  assignees: User[]
  currentUserId: string
  /** При поиске/фильтрах отключаем DnD, чтобы индексы совпадали с хранилищем */
  isDragDisabled?: boolean
  onOpenReport?: () => void
}

export function TaskCard({
  task,
  index,
  assignees,
  currentUserId,
  isDragDisabled,
  onOpenReport,
}: Props) {
  const dispatch = useAppDispatch()
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const overdue = isOverdue(task.deadline)
  const isAssignee = task.assigneeIds.includes(currentUserId)

  const handleAccept = () => {
    if (!isAssignee) {
      toast.error('Принять могут только назначенные исполнители')
      return
    }
    if (task.column !== 'assigned') return
    const dest = KANBAN_COLUMNS.find((c) => c.id === 'in_progress')
    if (!dest) return
    const nextOrder =
      // порядок в конец колонки — упростим: большой order
      Date.now()
    dispatch(
      setTaskColumn({
        taskId: task.id,
        column: 'in_progress',
        order: nextOrder,
      }),
    )
    toast.success('Задача принята в работу')
  }

  const saveDeadline = (v: string) => {
    dispatch(updateTask({ taskId: task.id, patch: { deadline: v } }))
    setEditing(false)
  }

  const cyclePriority = () => {
    const order: Priority[] = ['low', 'medium', 'high']
    const i = order.indexOf(task.priority)
    const next = order[(i + 1) % order.length]
    dispatch(updateTask({ taskId: task.id, patch: { priority: next } }))
  }

  const toggleAssigneeCompleted = (assigneeId: string, checked: boolean) => {
    // Отмечать можно только себя.
    if (currentUserId !== assigneeId) {
      toast.error('Вы можете отметить только свой отчет')
      return
    }
    const report = task.assigneeReports?.[assigneeId]
    const hasAttachment = (report?.attachments?.length ?? 0) > 0
    if (checked && !hasAttachment) {
      toast.error('Сначала прикрепите файл отчета, затем ставьте галочку')
      return
    }
    dispatch(setAssigneeCompleted({ taskId: task.id, userId: assigneeId, completed: checked }))

    if (checked) {
      const allCompleted = task.assigneeIds.every((id) => {
        if (id === assigneeId) return true
        return !!task.assigneeReports?.[id]?.completed
      })
      if (allCompleted && task.column === 'in_progress') {
        dispatch(
          setTaskColumn({
            taskId: task.id,
            column: 'completed',
            order: Date.now(),
          }),
        )
        toast.success('Все исполнители отчитались, задача перенесена в «Выполненные»')
      }
    }
  }

  return (
    <Draggable
      draggableId={task.id}
      index={index}
      isDragDisabled={isDragDisabled || task.column === 'in_progress'}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group rounded-xl border border-slate-200/80 bg-white p-3 shadow-card transition hover:shadow-card-hover ${
            snapshot.isDragging ? 'rotate-1 shadow-lg ring-2 ring-teal-400/40' : ''
          }`}
          onClick={() => {
            if (task.column === 'in_progress' && task.assigneeIds.length > 1) {
              setExpanded((p) => !p)
            }
          }}
        >
          <div className="flex gap-2">
            <div className="mt-0.5 cursor-grab text-slate-300 hover:text-slate-500">
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug text-slate-900">{task.description}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${priorityBadgeClass(task.priority)}`}
                >
                  <Flag className="mr-1 h-3 w-3" />
                  {priorityLabel(task.priority)}
                </span>
                {editing ? (
                  <input
                    type="date"
                    className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs"
                    defaultValue={task.deadline}
                    onBlur={(e) => saveDeadline(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${
                      overdue ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(task.deadline), 'd MMM yyyy', { locale: ru })}
                    {overdue && <span className="text-red-600"> · просрочено</span>}
                    <Pencil className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                  </button>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <AvatarStack users={assignees} />
                <div className="flex flex-wrap justify-end gap-1">
                  <button
                    type="button"
                    onClick={cyclePriority}
                    className="rounded-lg px-2 py-1 text-xs text-teal-700 hover:bg-teal-50"
                  >
                    Приоритет
                  </button>
                  {task.column === 'in_progress' && isAssignee && onOpenReport && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenReport()
                      }}
                      className="rounded-lg bg-teal-600 px-2 py-1 text-xs font-medium text-white shadow hover:bg-teal-700"
                    >
                      Отчёт
                    </button>
                  )}
                  {task.column === 'assigned' && isAssignee && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAccept()
                      }}
                      className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white shadow hover:bg-blue-700"
                    >
                      Принять в работу
                    </button>
                  )}
                </div>
              </div>

              {task.column === 'in_progress' && task.assigneeIds.length > 1 && expanded && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <p className="mb-2 text-xs font-medium text-slate-600">Исполнители и отчеты</p>
                  <ul className="space-y-1">
                    {assignees.map((a) => {
                      const rep = task.assigneeReports?.[a.id]
                      const checked = !!rep?.completed
                      const hasAttachment = (rep?.attachments?.length ?? 0) > 0
                      return (
                        <li key={a.id} className="flex items-center justify-between gap-2 rounded-md px-1 py-1">
                          <span className="truncate text-xs text-slate-700">{a.name}</span>
                          <label className="inline-flex items-center gap-1 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => toggleAssigneeCompleted(a.id, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            {hasAttachment ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700">
                                <Check className="h-3 w-3" />
                                Отчет
                              </span>
                            ) : (
                              <span className="text-amber-700">Нет файла</span>
                            )}
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              <p className="mt-2 text-[10px] text-slate-400">Клик по дате — изменить дедлайн</p>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
