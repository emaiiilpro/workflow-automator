import { useState } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import { Plus, Trash2, X } from 'lucide-react'
import type { Task, TaskColumn, User } from '@/types'
import { TaskCard } from '@/components/board/TaskCard'

type Props = {
  columnId: TaskColumn
  title: string
  tasks: Task[]
  assigneesOf: (ids: string[]) => User[]
  currentUserId: string
  isAdmin: boolean
  canCreateHere: boolean
  onCreateClick?: () => void
  canQuickCreate?: boolean
  onQuickCreate?: (title: string) => void
  canDelete?: boolean
  onDelete?: () => void
  isDragDisabled?: boolean
}

export function BoardColumn({
  columnId,
  title,
  tasks,
  assigneesOf,
  currentUserId,
  isAdmin,
  canCreateHere,
  onCreateClick,
  canQuickCreate,
  onQuickCreate,
  canDelete,
  onDelete,
  isDragDisabled,
}: Props) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const [quickTaskTitle, setQuickTaskTitle] = useState('')

  const submitQuickTask = () => {
    if (!quickTaskTitle.trim() || !onQuickCreate) return
    onQuickCreate(quickTaskTitle.trim())
    setQuickTaskTitle('')
    setQuickCreateOpen(false)
  }

  return (
    <div className="flex h-full min-h-0 w-[min(100%,320px)] shrink-0 flex-col rounded-2xl bg-slate-100/80 p-3 shadow-inner">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 shadow-sm">
            {tasks.length}
          </span>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-red-700"
              aria-label={`Удалить колонку ${title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Droppable droppableId={columnId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`min-h-[200px] space-y-2 rounded-xl p-1 transition ${
                snapshot.isDraggingOver ? 'bg-teal-50/80 ring-2 ring-teal-200' : ''
              }`}
            >
              {tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  assignees={assigneesOf(task.assigneeIds)}
                  currentUserId={currentUserId}
                  isDragDisabled={isDragDisabled}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>

      {canCreateHere && isAdmin && (
        <button
          type="button"
          onClick={onCreateClick}
          className="mt-2 flex shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2 text-sm font-medium text-teal-800 hover:border-teal-400 hover:bg-white"
        >
          <Plus className="h-4 w-4" />
          Новая задача
        </button>
      )}

      {canQuickCreate && isAdmin && (
        <div className="mt-2 shrink-0">
          {quickCreateOpen ? (
            <div className="space-y-2 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
              <input
                autoFocus
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitQuickTask()
                  if (e.key === 'Escape') {
                    setQuickCreateOpen(false)
                    setQuickTaskTitle('')
                  }
                }}
                placeholder="Введите название карточки..."
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={submitQuickTask}
                  className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Добавить карточку
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickCreateOpen(false)
                    setQuickTaskTitle('')
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="Закрыть форму добавления карточки"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setQuickCreateOpen(true)}
              className="flex w-full items-center justify-center rounded-xl border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-700 hover:border-teal-400 hover:bg-white"
              aria-label={`Добавить карточку в колонку ${title}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
