import { useState } from 'react'
import { X } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import toast from 'react-hot-toast'
import type { Priority, User } from '@/types'
import { useAppDispatch } from '@/store/hooks'
import { addTask } from '@/store/slices/tasksSlice'
import { priorityLabel } from '@/utils/priority'

type Props = {
  boardId: string
  members: User[]
  onClose: () => void
}

export function CreateTaskModal({ boardId, members, onClose }: Props) {
  const dispatch = useAppDispatch()
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState(() => new Date().toISOString().slice(0, 10))
  const [priority, setPriority] = useState<Priority>('medium')
  const [descriptionFile, setDescriptionFile] = useState<File | null>(null)
  const [includeReportField, setIncludeReportField] = useState(true)
  const [includeFamiliarizationField, setIncludeFamiliarizationField] = useState(true)
  const [assigneeIds, setAssigneeIds] = useState<string[]>(() =>
    members[0] ? [members[0].id] : [],
  )

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const submit = () => {
    if (!description.trim()) {
      toast.error('Введите описание')
      return
    }
    if (assigneeIds.length === 0) {
      toast.error('Назначьте хотя бы одного участника')
      return
    }
    const taskId = uuid()
    const baseTask = {
      id: taskId,
      boardId,
      column: 'assigned' as const,
      description: description.trim(),
      deadline,
      priority,
      assigneeIds,
      order: Date.now(),
      checklistConfig: {
        report: includeReportField,
        familiarization: includeFamiliarizationField,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900">Новая задача</h2>
        <p className="mt-1 text-sm text-slate-500">Появится в колонке «Назначенные»</p>

        <label className="mt-4 block text-sm font-medium text-slate-700">Описание</label>
        <textarea
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="mt-3 block text-sm font-medium text-slate-700">
          Файл к описанию задачи
        </label>
        <input
          type="file"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          onChange={(e) => setDescriptionFile(e.target.files?.[0] ?? null)}
        />

        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-700">Чеклист карточки</p>
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={includeReportField}
              onChange={(e) => setIncludeReportField(e.target.checked)}
            />
            Поле «Рапорт»
          </label>
          <label className="mt-1 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={includeFamiliarizationField}
              onChange={(e) => setIncludeFamiliarizationField(e.target.checked)}
            />
            Поле «Лист ознакомления»
          </label>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Дедлайн</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
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
          {members.map((m) => (
            <label
              key={m.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={assigneeIds.includes(m.id)}
                onChange={() => toggleAssignee(m.id)}
              />
              <span className="text-sm">
                {m.name} <span className="text-slate-400">({m.email})</span>
              </span>
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
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
            Создать
          </button>
        </div>
      </div>
    </div>
  )
}
