import { useRef, useState } from 'react'
import { AlarmClock, Calendar, X } from 'lucide-react'
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
          {taskToEdit?.descriptionAttachment && !descriptionFile && (
            <p className="mt-1 text-xs text-slate-600">
              Сейчас: {taskToEdit.descriptionAttachment.name} — выберите другой файл, чтобы заменить
            </p>
          )}
          <input
            type="file"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            onChange={(e) => setDescriptionFile(e.target.files?.[0] ?? null)}
          />
          <label className="mt-3 block text-sm font-medium text-slate-700">Описание</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="mt-3 space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Срок исполнения</label>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white py-1 pl-2 pr-1 shadow-inner">
                  <input
                    ref={dateInputRef}
                    type="date"
                    className="date-input-tight max-w-[9.5rem] border-0 bg-transparent py-1 text-sm text-slate-900 focus:outline-none focus:ring-0"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                    aria-label="Выбрать дату"
                    title="Календарь"
                    onClick={() => dateInputRef.current?.showPicker?.()}
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
                <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white py-1 pl-2 pr-1 shadow-inner">
                  <input
                    ref={timeInputRef}
                    type="time"
                    className="time-input-tight max-w-[6.5rem] border-0 bg-transparent py-1 text-sm text-slate-900 focus:outline-none focus:ring-0"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                  />
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                    aria-label="Выбрать время"
                    title="Время"
                    onClick={() => timeInputRef.current?.showPicker?.()}
                  >
                    <AlarmClock className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Приоритет</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
