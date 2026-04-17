import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { ArrowLeft, LayoutGrid, Search, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useAuth } from '@/hooks/useAuth'
import { KANBAN_COLUMNS, canMoveColumn } from '@/constants/kanban'
import type { Priority, Task, TaskColumn, User } from '@/types'
import { BoardColumn } from '@/components/board/BoardColumn'
import { CreateTaskModal } from '@/components/board/CreateTaskModal'
import { TaskReportModal } from '@/components/board/TaskReportModal'
import { updateTask, reorderInColumn } from '@/store/slices/tasksSlice'
import { addBoard } from '@/store/slices/boardsSlice'
import { v4 as uuid } from 'uuid'

export function BoardPage() {
  const { spaceId, boardId } = useParams<{ spaceId: string; boardId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user, isAdmin } = useAuth()

  const spaces = useAppSelector((s) => s.spaces)
  const boards = useAppSelector((s) => s.boards)
  const tasks = useAppSelector((s) => s.tasks)
  const users = useAppSelector((s) => s.users)

  const [search, setSearch] = useState('')
  const [filterUserId, setFilterUserId] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [reportTaskId, setReportTaskId] = useState<string | null>(null)

  const space = spaces.find((x) => x.id === spaceId)
  const board = boards.find((x) => x.id === boardId && x.spaceId === spaceId)
  const visibleSpaces = spaces.filter((s) => isAdmin || (user ? s.memberIds.includes(user.id) : false))

  const members: User[] = useMemo(() => {
    if (!space) return []
    return space.memberIds
      .map((id) => users.find((u) => u.id === id))
      .filter((u): u is User => !!u)
  }, [space, users])

  const assigneesOf = (ids: string[]) =>
    ids.map((id) => users.find((u) => u.id === id)).filter((u): u is User => !!u)

  const baseTasks = useMemo(() => {
    if (!boardId || !user) return []
    return tasks.filter((t) => {
      if (t.boardId !== boardId) return false
      if (isAdmin) return true
      return t.assigneeIds.includes(user.id)
    })
  }, [tasks, boardId, user, isAdmin])

  const filtersActive = Boolean(search.trim() || filterUserId || filterPriority)

  const visibleTasks = useMemo(() => {
    return baseTasks.filter((t) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!t.description.toLowerCase().includes(q)) return false
      }
      if (filterUserId && !t.assigneeIds.includes(filterUserId)) return false
      if (filterPriority && t.priority !== filterPriority) return false
      return true
    })
  }, [baseTasks, search, filterUserId, filterPriority])

  const tasksByColumn = (col: TaskColumn): Task[] =>
    visibleTasks
      .filter((t) => t.column === col)
      .sort((a, b) => a.order - b.order)

  const onDragEnd = (result: DropResult) => {
    if (!boardId || !user) return
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    const sourceCol = source.droppableId as TaskColumn
    const destCol = destination.droppableId as TaskColumn

    if (sourceCol !== destCol && !canMoveColumn(sourceCol, destCol)) {
      toast.error('Можно переносить задачи только слева направо')
      return
    }

    const moved = tasks.find((t) => t.id === draggableId)
    if (!moved || moved.boardId !== boardId) return

    if (!isAdmin && !moved.assigneeIds.includes(user.id)) {
      toast.error('Нельзя перемещать чужую задачу')
      return
    }

    // Только видимые карточки в колонках; перестройка порядка по полному списку задач доски
    const columnTasks = (col: TaskColumn): Task[] =>
      tasks
        .filter((t) => t.boardId === boardId && t.column === col)
        .sort((a, b) => a.order - b.order)

    if (sourceCol === destCol) {
      const ids = columnTasks(sourceCol).map((t) => t.id)
      const next = Array.from(ids)
      const [removed] = next.splice(source.index, 1)
      next.splice(destination.index, 0, removed)
      dispatch(reorderInColumn({ boardId, column: sourceCol, orderedIds: next }))
      return
    }

    const srcIds = columnTasks(sourceCol)
      .filter((t) => t.id !== draggableId)
      .map((t) => t.id)
    const destBase = columnTasks(destCol).filter((t) => t.id !== draggableId)
    const destIds = destBase.map((t) => t.id)
    destIds.splice(destination.index, 0, draggableId)

    dispatch(updateTask({ taskId: draggableId, patch: { column: destCol } }))
    dispatch(reorderInColumn({ boardId, column: sourceCol, orderedIds: srcIds }))
    dispatch(reorderInColumn({ boardId, column: destCol, orderedIds: destIds }))
  }

  const openSpaceWithBoard = (targetSpaceId: string) => {
    const spaceBoards = boards.filter((b) => b.spaceId === targetSpaceId)

    if (spaceBoards.length > 0) {
      navigate(`/spaces/${targetSpaceId}/board/${spaceBoards[0].id}`)
      return
    }

    if (!isAdmin) {
      toast.error('В этом пространстве ещё нет доски')
      navigate(`/spaces/${targetSpaceId}`)
      return
    }

    const newBoardId = uuid()
    dispatch(
      addBoard({
        id: newBoardId,
        spaceId: targetSpaceId,
        name: 'Новая доска',
      }),
    )
    toast.success('Создана новая доска в выбранном пространстве')
    navigate(`/spaces/${targetSpaceId}/board/${newBoardId}`)
  }

  if (!spaceId || !boardId || !space || !board || !user) {
    return (
      <div className="p-8 text-center text-slate-600">
        Доска не найдена.{' '}
        <button type="button" className="text-teal-700 underline" onClick={() => navigate('/spaces')}>
          К пространствам
        </button>
      </div>
    )
  }

  if (!space.memberIds.includes(user.id)) {
    return (
      <div className="p-8 text-center text-slate-600">
        Нет доступа к этому пространству.{' '}
        <button type="button" className="text-teal-700 underline" onClick={() => navigate('/spaces')}>
          Назад
        </button>
      </div>
    )
  }

  const reportTask = reportTaskId ? tasks.find((t) => t.id === reportTaskId) : undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <header className="border-b border-white/60 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/spaces/${spaceId}`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Link>
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-teal-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{space.name}</p>
                <h1 className="text-lg font-bold text-slate-900">{board.name}</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1600px] flex-wrap items-end gap-3 border-t border-slate-100 px-4 py-3">
          {filtersActive && (
            <p className="w-full text-xs text-amber-800">
              Активны фильтры — перетаскивание отключено, чтобы не сбить порядок задач.
            </p>
          )}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Поиск по описанию…"
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm shadow-inner focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
            >
              <option value="">Все исполнители</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={filterPriority}
              onChange={(e) => setFilterPriority((e.target.value as Priority | '') || '')}
            >
              <option value="">Все приоритеты</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card lg:sticky lg:top-4 lg:h-fit">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Пространства
            </h2>
            <ul className="mt-3 space-y-2">
              {visibleSpaces.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => openSpaceWithBoard(s.id)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                      s.id === space.id
                        ? 'bg-blue-50 font-semibold text-blue-800 ring-1 ring-blue-200'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="overflow-x-auto">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex min-w-min gap-4 pb-4">
                {KANBAN_COLUMNS.map((col) => (
                  <BoardColumn
                    key={col.id}
                    columnId={col.id}
                    title={col.title}
                    tasks={tasksByColumn(col.id)}
                    assigneesOf={assigneesOf}
                    currentUserId={user.id}
                    isAdmin={isAdmin}
                    canCreateHere={col.id === 'assigned'}
                    onCreateClick={() => setCreateOpen(true)}
                    setReportForTaskId={setReportTaskId}
                    isDragDisabled={filtersActive}
                  />
                ))}
              </div>
            </DragDropContext>
          </div>
        </div>
      </main>

      {createOpen && isAdmin && (
        <CreateTaskModal
          boardId={board.id}
          members={members}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {reportTask && (
        <TaskReportModal task={reportTask} onClose={() => setReportTaskId(null)} />
      )}
    </div>
  )
}
