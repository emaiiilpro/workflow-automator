import { useEffect, useRef, useState } from 'react'
import { AlarmClock, Calendar, Paperclip, X } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import toast from 'react-hot-toast'
import type { Priority, Task, User } from '@/types'
import { useAppDispatch } from '@/store/hooks'
import { addTask, updateTask } from '@/store/slices/tasksSlice'
import { priorityLabel } from '@/utils/priority'
import { normalizeDueTimeFromInput } from '@/utils/deadline'

type Props = {
  boardId: string
  boardMembers: User[]
  onClose: () => void
  /** Редактирование существующей задачи в «Назначенные» */
  taskToEdit?: Task | null
}

export function CreateTaskModal({
  boardId,
  boardMembers,
  onClose,
  taskToEdit = null,
}: Props) {
  const dispatch = useAppDispatch()
  const isEdit = Boolean(taskToEdit)
  const [description, setDescription] = useState(() => taskToEdit?.description ?? '')
  const [deadline, setDeadline] = useState(
    () => taskToEdit?.deadline ?? new Date().toISOString().slice(0, 10),
  )
  const [dueTime, setDueTime] = useState(() => taskToEdit?.dueTime ?? '')
  const [priority, setPriority] = useState<Priority>(() => taskToEdit?.priority ?? 'medium')
  const [descriptionFile, setDescriptionFile] = useState<File | null>(null)
  /** При редактировании: снять существующее вложение к описанию при сохранении */
  const [removeDescriptionAttachment, setRemoveDescriptionAttachment] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [assigneeIds, setAssigneeIds] = useState<string[]>(() =>
    taskToEdit ? [...taskToEdit.assigneeIds] : boardMembers[0] ? [boardMembers[0].id] : [],
  )

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const allMemberIds = boardMembers.map((m) => m.id)
  const allAssigneesSelected =
    boardMembers.length > 0 && allMemberIds.every((id) => assigneeIds.includes(id))

  const toggleAssignAll = () => {
    if (boardMembers.length === 0) return
    if (allAssigneesSelected) setAssigneeIds([])
    else setAssigneeIds([...allMemberIds])
  }

  const dateInputRef = useRef<HTMLInputElement>(null)
  const timeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setRemoveDescriptionAttachment(false)
    setDescriptionFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [taskToEdit?.id, isEdit])

  const submit = () => {
    if (!description.trim()) {
      toast.error('Введите описание')
      return
    }
    if (assigneeIds.length === 0) {
      toast.error('Назначьте хотя бы одного участника')
      return
    }

    const normalizedTime = normalizeDueTimeFromInput(dueTime)
    if (normalizedTime === undefined) {
      toast.error('Некорректное время, используйте формат ЧЧ:ММ')
      return
    }

    if (isEdit && taskToEdit) {
      const patch: Partial<Task> = {
        description: description.trim(),
        deadline,
        priority,
        assigneeIds,
        dueTime: normalizedTime,
      }
      if (removeDescriptionAttachment && !descriptionFile) {
        Object.assign(patch, { descriptionAttachment: undefined })
      }
      if (descriptionFile) {
        const reader = new FileReader()
        reader.onload = () => {
          const data = reader.result
          if (typeof data !== 'string') return
          dispatch(
            updateTask({
              taskId: taskToEdit.id,
              patch: {
                ...patch,
                descriptionAttachment: {
                  id: uuid(),
                  name: descriptionFile.name,
                  mime: descriptionFile.type || 'application/octet-stream',
                  dataBase64: data,
                },
              },
            }),
          )
          toast.success('Задача обновлена')
          onClose()
        }
        reader.readAsDataURL(descriptionFile)
        return
      }
      dispatch(updateTask({ taskId: taskToEdit.id, patch }))
      toast.success('Задача обновлена')
      onClose()
      return
    }

    const taskId = uuid()
    const baseTask = {
      id: taskId,
      boardId,
      column: 'assigned' as const,
      description: description.trim(),
      deadline,
      ...(normalizedTime ? { dueTime: normalizedTime } : {}),
      priority,
      assigneeIds,
      order: Date.now(),
      checklistConfig: {
        report: true,
        familiarization: true,
      },
      checklistState: {
        report: false,
        familiarization: false,
      },
    }

    if (!descriptionFile) {
      dispatch(addTask(baseTask))
      toast.success('Задача создана в «Назначенные»')
      onClose()
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result
      if (typeof data !== 'string') return
      dispatch(
        addTask({
          ...baseTask,
          descriptionAttachment: {
            id: uuid(),
            name: descriptionFile.name,
            mime: descriptionFile.type || 'application/octet-stream',
            dataBase64: data,
          },
        }),
      )
      toast.success('Задача создана в «Назначенные»')
      onClose()
    }
    reader.readAsDataURL(descriptionFile)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="overflow-y-auto px-6 pb-4 pt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Редактировать задачу' : 'Новая задача'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isEdit
              ? 'Карточка в колонке «Назначенные»'
              : 'Появится в колонке «Назначенные»'}
          </p>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Файл к описанию задачи
          </label>
          {isEdit &&
            taskToEdit?.descriptionAttachment &&
            !descriptionFile &&
            !removeDescriptionAttachment && (
              <div className="mt-2 flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 shadow-inner">
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-xs text-slate-700">
                  {taskToEdit.descriptionAttachment.name}
                </span>
                <button
                  type="button"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-900 transition hover:bg-rose-200"
                  onClick={() => setRemoveDescriptionAttachment(true)}
                  aria-label="Удалить файл"
                  title="Удалить файл"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                </button>
              </div>
            )}
          {isEdit && removeDescriptionAttachment && !descriptionFile && (
            <p className="mt-1 text-xs text-amber-800">
              Вложение будет удалено после нажатия «Сохранить»
            </p>
          )}
          {descriptionFile && (
            <div className="mt-2 flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 shadow-inner">
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{descriptionFile.name}</span>
              <button
                type="button"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-900 transition hover:bg-rose-200"
                onClick={() => {
                  setDescriptionFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                aria-label="Убрать файл"
                title="Убрать файл"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              setDescriptionFile(f)
              if (f) setRemoveDescriptionAttachment(false)
            }}
          />
          <label className="mt-3 block text-sm font-medium text-slate-700">Описание</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="mt-3 min-w-0">
            <div className="mb-1 grid min-w-0 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5">
              <label className="text-sm font-medium text-slate-700">Срок исполнения</label>
              <label htmlFor="task-priority" className="text-right text-sm font-medium text-slate-700">
                Приоритет
              </label>
            </div>
            <div className="grid min-w-0 grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2">
              <div className="inline-flex w-max max-w-full items-center gap-0.5 rounded-xl border border-slate-200 bg-white py-1 pl-1.5 pr-0.5 shadow-inner">
                <input
                  ref={dateInputRef}
                  type="date"
                  id="task-deadline-date"
                  className="date-input-tight w-[7.75rem] min-w-0 border-0 bg-transparent py-1 pl-0.5 pr-0 text-sm text-slate-900 focus:outline-none focus:ring-0"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
                <button
                  type="button"
                  className="inline-flex h-8 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                  aria-label="Выбрать дату"
                  title="Календарь"
                  onClick={() => dateInputRef.current?.showPicker?.()}
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </div>
              <div className="inline-flex w-max max-w-full items-center gap-0.5 rounded-xl border border-slate-200 bg-white py-1 pl-1.5 pr-0.5 shadow-inner">
                <input
                  ref={timeInputRef}
                  type="time"
                  id="task-deadline-time"
                  className="time-input-tight w-[5.25rem] min-w-0 border-0 bg-transparent py-1 pl-0.5 pr-0 text-sm text-slate-900 focus:outline-none focus:ring-0"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
                <button
                  type="button"
                  className="inline-flex h-8 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                  aria-label="Выбрать время"
                  title="Время"
                  onClick={() => timeInputRef.current?.showPicker?.()}
                >
                  <AlarmClock className="h-4 w-4" />
                </button>
              </div>
              <select
                id="task-priority"
                className="h-9 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm shadow-inner focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <option key={p} value={p}>
                    {priorityLabel(p)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="mt-4 block text-sm font-medium text-slate-700">Назначить</label>
          <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
            {boardMembers.length > 0 && (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 font-medium hover:bg-slate-100">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0"
                  checked={allAssigneesSelected}
                  onChange={toggleAssignAll}
                />
                <span className="text-sm text-slate-800">Все</span>
              </label>
            )}
            {boardMembers.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0"
                  checked={assigneeIds.includes(m.id)}
                  onChange={() => toggleAssignee(m.id)}
                />
                <span className="text-sm">
                  {m.name} <span className="text-slate-400">({m.email})</span>
                </span>
              </label>
            ))}
            {boardMembers.length === 0 && (
              <p className="px-2 py-1 text-sm text-slate-500">
                Нет участников доски. Состав настраивается в настройках пространства.
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-teal-700"
          >
            {isEdit ? 'Сохранить' : 'Создать'}
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}
