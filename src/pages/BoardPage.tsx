import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { ArrowLeft, Check, LayoutGrid, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useAuth } from '@/hooks/useAuth'
import { KANBAN_COLUMNS, canMoveColumn } from '@/constants/kanban'
import type { Priority, Task, TaskColumn, User } from '@/types'
import { BoardColumn } from '@/components/board/BoardColumn'
import { CreateTaskModal } from '@/components/board/CreateTaskModal'
import {
  addTask,
  removeTasksByBoard,
  removeTasksByBoardColumn,
  updateTask,
  reorderInColumn,
} from '@/store/slices/tasksSlice'
import {
  addBoard,
  addCustomColumn,
  setBoardMembers,
  setSpaceBoardsMembers,
  removeCustomColumn,
  removeBoard,
} from '@/store/slices/boardsSlice'
import { addSpace, removeSpace, renameSpace } from '@/store/slices/spacesSlice'
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
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState('')
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null)
  const [editingSpaceName, setEditingSpaceName] = useState('')
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')

  const space = spaces.find((x) => x.id === spaceId)
  const board = boards.find((x) => x.id === boardId && x.spaceId === spaceId)
  const visibleSpaces = spaces.filter((s) => isAdmin || (user ? s.memberIds.includes(user.id) : false))
  const boardsInCurrentSpace = boards.filter((item) => item.spaceId === spaceId)

  const spaceMembers: User[] = useMemo(() => {
    if (!space) return []
    return space.memberIds
      .map((id) => users.find((u) => u.id === id))
      .filter((u): u is User => !!u)
  }, [space, users])

  const boardMemberIds = useMemo(
    () => board?.memberIds ?? space?.memberIds ?? [],
    [board?.memberIds, space?.memberIds],
  )

  const boardMembers: User[] = useMemo(
    () =>
      boardMemberIds
        .map((id) => users.find((u) => u.id === id))
        .filter((u): u is User => !!u),
    [boardMemberIds, users],
  )

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

  const boardColumns = useMemo(() => {
    const custom =
      board?.customColumns
        ?.slice()
        .sort((a, b) => a.order - b.order)
        .map((col) => ({ id: col.id as TaskColumn, title: col.title, isCustom: true })) ?? []
    return [
      ...KANBAN_COLUMNS.map((col) => ({ id: col.id as TaskColumn, title: col.title, isCustom: false })),
      ...custom,
    ]
  }, [board])

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

    if (sourceCol === 'in_progress') {
      toast.error('Перенос из «В работе» мышкой отключен')
      return
    }

    if (sourceCol !== destCol && !canMoveColumn(sourceCol, destCol)) {
      toast.error('Нельзя перенести задачу в выбранную колонку')
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
      navigate('/board')
      return
    }

    const newBoardId = uuid()
    dispatch(
      addBoard({
        id: newBoardId,
        spaceId: targetSpaceId,
        name: 'Новая доска',
        memberIds: space?.memberIds ?? [],
      }),
    )
    toast.success('Создана новая доска в выбранном пространстве')
    navigate(`/spaces/${targetSpaceId}/board/${newBoardId}`)
  }

  const createSpaceFromSidebar = () => {
    if (!isAdmin) return
    if (!newSpaceName.trim() || !user) {
      toast.error('Введите название пространства')
      return
    }
    const newSpaceId = uuid()
    const newBoardId = uuid()
    dispatch(
      addSpace({
        id: newSpaceId,
        name: newSpaceName.trim(),
        memberIds: [user.id],
      }),
    )
    dispatch(
      addBoard({
        id: newBoardId,
        spaceId: newSpaceId,
        name: 'Новая доска',
        memberIds: [user.id],
      }),
    )
    setNewSpaceName('')
    setIsCreateSpaceOpen(false)
    toast.success('Пространство создано')
    navigate(`/spaces/${newSpaceId}/board/${newBoardId}`)
  }

  const deleteSpaceFromSidebar = (targetSpaceId: string) => {
    if (!isAdmin || !space) return
    const target = spaces.find((s) => s.id === targetSpaceId)
    if (!target) return
    if (!confirm(`Удалить пространство «${target.name}» и все его доски/задачи?`)) return

    const targetBoards = boards.filter((b) => b.spaceId === targetSpaceId)
    targetBoards.forEach((b) => {
      dispatch(removeTasksByBoard(b.id))
      dispatch(removeBoard(b.id))
    })
    dispatch(removeSpace(targetSpaceId))

    const remaining = visibleSpaces.filter((s) => s.id !== targetSpaceId)
    if (remaining.length === 0) {
      toast.success('Пространство удалено')
      navigate('/board')
      return
    }

    // Переход к первому доступному пространству после удаления.
    openSpaceWithBoard(remaining[0].id)
    toast.success('Пространство удалено')
  }

  const startRenameSpace = (targetSpaceId: string, currentName: string) => {
    if (!isAdmin) return
    setEditingSpaceId(targetSpaceId)
    setEditingSpaceName(currentName)
  }

  const submitRenameSpace = () => {
    if (!isAdmin || !editingSpaceId) return
    if (!editingSpaceName.trim()) {
      toast.error('Название пространства не может быть пустым')
      return
    }
    dispatch(
      renameSpace({
        spaceId: editingSpaceId,
        name: editingSpaceName.trim(),
      }),
    )
    setEditingSpaceId(null)
    setEditingSpaceName('')
    toast.success('Пространство переименовано')
  }

  const submitNewColumn = () => {
    if (!boardId || !isAdmin) return
    if (!newColumnName.trim()) {
      toast.error('Введите название колонки')
      return
    }
    const nextOrder = board?.customColumns?.length ?? 0
    dispatch(
      addCustomColumn({
        boardId,
        column: {
          id: `custom_${uuid()}`,
          title: newColumnName.trim(),
          order: nextOrder,
        },
      }),
    )
    setNewColumnName('')
    setIsAddColumnOpen(false)
    toast.success('Колонка добавлена')
  }

  const createQuickTask = (columnId: TaskColumn, title: string) => {
    if (!boardId || !user || !isAdmin) return
    const order = tasks
      .filter((task) => task.boardId === boardId && task.column === columnId)
      .length
    dispatch(
      addTask({
        id: uuid(),
        boardId,
        column: columnId,
        description: title,
        deadline: new Date().toISOString().slice(0, 10),
        priority: 'medium',
        assigneeIds: [user.id],
        order,
      }),
    )
    toast.success('Карточка добавлена')
  }

  const toggleBoardMember = (userId: string, checked: boolean) => {
    if (!boardId || !isAdmin) return
    const nextIds = checked
      ? Array.from(new Set([...boardMemberIds, userId]))
      : boardMemberIds.filter((id) => id !== userId)
    dispatch(setBoardMembers({ boardId, memberIds: nextIds }))
  }

  const applyMembersToAllSpaceBoards = () => {
    if (!spaceId || !isAdmin) return
    dispatch(setSpaceBoardsMembers({ spaceId, memberIds: boardMemberIds }))
    toast.success('Участники применены ко всем доскам пространства')
  }

  const deleteCustomColumn = (columnId: TaskColumn, title: string) => {
    if (!boardId || !isAdmin || !columnId.startsWith('custom_')) return
    if (!confirm(`Удалить колонку «${title}» и все карточки в ней?`)) return
    dispatch(removeTasksByBoardColumn({ boardId, column: columnId }))
    dispatch(removeCustomColumn({ boardId, columnId: columnId as `custom_${string}` }))
    toast.success('Колонка удалена')
  }

  if (!spaceId || !boardId || !space || !board || !user) {
    return (
      <div className="p-8 text-center text-slate-600">
        Доска не найдена.{' '}
        <button type="button" className="text-teal-700 underline" onClick={() => navigate('/board')}>
          К доске
        </button>
      </div>
    )
  }

  if (!space.memberIds.includes(user.id)) {
    return (
      <div className="p-8 text-center text-slate-600">
        Нет доступа к этому пространству.{' '}
        <button type="button" className="text-teal-700 underline" onClick={() => navigate('/board')}>
          Назад
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(rgba(248,250,252,0.72),rgba(248,250,252,0.72)),url('/workflow-bg.png')] bg-cover bg-center bg-fixed">
      <header className="border-b border-white/60 bg-white/70">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/board"
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
              {boardMembers.map((m) => (
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
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Пространства
              </h2>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsCreateSpaceOpen((p) => !p)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="Создать пространство"
                  aria-label="Создать пространство"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            {isAdmin && isCreateSpaceOpen && (
              <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                <input
                  placeholder="Название пространства"
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateSpaceOpen(false)
                      setNewSpaceName('')
                    }}
                    className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={createSpaceFromSidebar}
                    className="rounded-lg bg-teal-600 px-2 py-1 text-xs font-semibold text-white hover:bg-teal-700"
                  >
                    Ок
                  </button>
                </div>
              </div>
            )}
            <ul className="mt-3 space-y-2">
              {visibleSpaces.map((s) => (
                <li key={s.id}>
                  <div
                    className={`flex items-center gap-1 rounded-xl px-1 py-1 transition ${
                      s.id === space.id
                        ? 'bg-blue-50 ring-1 ring-blue-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {editingSpaceId === s.id ? (
                      <div className="flex min-w-0 flex-1 items-center gap-1">
                        <input
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                          value={editingSpaceName}
                          onChange={(e) => setEditingSpaceName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitRenameSpace()
                            if (e.key === 'Escape') {
                              setEditingSpaceId(null)
                              setEditingSpaceName('')
                            }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={submitRenameSpace}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-emerald-700"
                          title="Сохранить"
                          aria-label="Сохранить новое название пространства"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSpaceId(null)
                            setEditingSpaceName('')
                          }}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-700"
                          title="Отмена"
                          aria-label="Отменить переименование пространства"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openSpaceWithBoard(s.id)}
                        className={`min-w-0 flex-1 truncate rounded-lg px-2 py-1 text-left text-sm ${
                          s.id === space.id
                            ? 'font-semibold text-blue-800'
                            : 'text-slate-700'
                        }`}
                      >
                        {s.name}
                      </button>
                    )}
                    {isAdmin && (
                      <>
                        {editingSpaceId !== s.id && (
                          <button
                            type="button"
                            onClick={() => startRenameSpace(s.id, s.name)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-blue-700"
                            title="Переименовать пространство"
                            aria-label={`Переименовать пространство ${s.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteSpaceFromSidebar(s.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-red-700"
                          title="Удалить пространство"
                          aria-label={`Удалить пространство ${s.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          <div className="overflow-x-auto">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex min-w-min gap-4 pb-4">
                {boardColumns.map((col) => (
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
                    canQuickCreate={col.isCustom}
                    onQuickCreate={(title) => createQuickTask(col.id, title)}
                    canDelete={col.isCustom}
                    onDelete={() => deleteCustomColumn(col.id, col.title)}
                    isDragDisabled={filtersActive}
                  />
                ))}
                {isAdmin && (
                  <div className="flex w-[min(100%,320px)] shrink-0 flex-col rounded-2xl bg-slate-100/70 p-3 shadow-inner">
                    {isAddColumnOpen ? (
                      <div className="space-y-2 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
                        <input
                          autoFocus
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitNewColumn()
                            if (e.key === 'Escape') {
                              setIsAddColumnOpen(false)
                              setNewColumnName('')
                            }
                          }}
                          placeholder="Введите имя колонки..."
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={submitNewColumn}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Добавить список
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddColumnOpen(false)
                              setNewColumnName('')
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                            aria-label="Закрыть форму добавления колонки"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddColumnOpen(true)}
                        className="flex h-full min-h-[82px] items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white/65 px-3 text-lg font-semibold text-white shadow-sm hover:bg-white/80"
                      >
                        <Plus className="h-5 w-5" />
                        Добавьте ещё одну колонку
                      </button>
                    )}
                  </div>
                )}
              </div>
            </DragDropContext>
          </div>
        </div>
      </main>

      {createOpen && isAdmin && (
        <CreateTaskModal
          boardId={board.id}
          boardMembers={boardMembers}
          spaceMembers={spaceMembers}
          onToggleBoardMember={toggleBoardMember}
          canApplyToAllBoards={boardsInCurrentSpace.length > 1}
          onApplyToAllBoards={applyMembersToAllSpaceBoards}
          onClose={() => setCreateOpen(false)}
        />
      )}

    </div>
  )
}
