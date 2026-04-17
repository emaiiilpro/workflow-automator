import { Droppable } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
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
  isDragDisabled,
}: Props) {
  return (
    <div className="flex w-[min(100%,320px)] shrink-0 flex-col rounded-2xl bg-slate-100/80 p-3 shadow-inner">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 shadow-sm">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] flex-1 space-y-2 rounded-xl p-1 transition ${
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

      {canCreateHere && isAdmin && (
        <button
          type="button"
          onClick={onCreateClick}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2 text-sm font-medium text-teal-800 hover:border-teal-400 hover:bg-white"
        >
          <Plus className="h-4 w-4" />
          Новая задача
        </button>
      )}
    </div>
  )
}
