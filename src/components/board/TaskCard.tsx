import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { Calendar, Check, Flag, GripVertical, Paperclip, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Priority, Task, TaskAttachment, User } from '@/types'
import { priorityBadgeClass, priorityLabel } from '@/utils/priority'
import { formatDeadlineDisplay, isOverdue } from '@/utils/deadline'
import { AvatarStack } from '@/components/ui/AvatarStack'
import { useAppDispatch } from '@/store/hooks'
import {
  appendReportAttachment,
  setAssigneeCompleted,
  setAssigneeReportComment,
  setTaskColumn,
  updateTask,
} from '@/store/slices/tasksSlice'
import { KANBAN_COLUMNS } from '@/constants/kanban'
import { v4 as uuid } from 'uuid'

const DOWNLOADED_ATTACHMENTS_KEY = 'workflow-downloaded-attachments-v1'

type Props = {
  task: Task
  index: number
  assignees: User[]
  currentUserId: string
  isAdmin?: boolean
  /** Админ: клик по карточке в «Назначенные» — открыть форму редактирования */
  onAdminEditAssignedTask?: (task: Task) => void
  /** При поиске/фильтрах отключаем DnD, чтобы индексы совпадали с хранилищем */
  isDragDisabled?: boolean
}

export function TaskCard({
  task,
  index,
  assignees,
  currentUserId,
  isAdmin = false,
  onAdminEditAssignedTask,
  isDragDisabled,
}: Props) {
  const dispatch = useAppDispatch()
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [preview, setPreview] = useState<{
    name: string
    mime: string
    url: string | null
    text: string | null
  } | null>(null)
  const overdue = isOverdue(task.deadline, task.dueTime)
  const descriptionAttachment = task.descriptionAttachment
  const isAssignee = task.assigneeIds.includes(currentUserId)
  const currentReport = task.assigneeReports?.[currentUserId]

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

  const onReportFileSelected = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') return
      dispatch(
        appendReportAttachment({
          taskId: task.id,
          userId: currentUserId,
          file: {
            id: uuid(),
            name: file.name,
            mime: file.type || 'application/octet-stream',
            dataBase64: result,
          },
        }),
      )
      toast.success('Файл отчета прикреплен')
    }
    reader.readAsDataURL(file)
  }

  const readDownloadedAttachmentIds = (): string[] => {
    try {
      const raw = localStorage.getItem(DOWNLOADED_ATTACHMENTS_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
    } catch {
      return []
    }
  }

  const markAttachmentAsDownloaded = (attachmentId: string) => {
    const current = new Set(readDownloadedAttachmentIds())
    current.add(attachmentId)
    localStorage.setItem(DOWNLOADED_ATTACHMENTS_KEY, JSON.stringify(Array.from(current)))
  }

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  const openAttachment = async (file: TaskAttachment) => {
    const raw = file.dataBase64

    const buildBlob = (): Blob | null => {
      if (raw.startsWith('data:')) {
        const parts = raw.split(',')
        if (parts.length < 2) return null
        const header = parts[0]
        const mimeMatch = header.match(/data:(.*?);base64/)
        const mime = mimeMatch?.[1] || file.mime || 'application/octet-stream'
        const bytes = atob(parts[1])
        const array = new Uint8Array(bytes.length)
        for (let i = 0; i < bytes.length; i += 1) {
          array[i] = bytes.charCodeAt(i)
        }
        return new Blob([array], { type: mime })
      }

      try {
        const bytes = atob(raw)
        const array = new Uint8Array(bytes.length)
        for (let i = 0; i < bytes.length; i += 1) {
          array[i] = bytes.charCodeAt(i)
        }
        return new Blob([array], { type: file.mime || 'application/octet-stream' })
      } catch {
        return null
      }
    }

    const blob = buildBlob()
    if (!blob) {
      toast.error('Не удалось открыть файл')
      return
    }

    const url = URL.createObjectURL(blob)
    const mime = (blob.type || file.mime || '').toLowerCase()
    const name = file.name.toLowerCase()
    const isTextPreview = mime.startsWith('text/') || /\.(txt|md|json|csv|log)$/.test(name)
    const isImagePreview = mime.startsWith('image/')
    const isPdfPreview = mime === 'application/pdf'

    if (isTextPreview) {
      const text = await blob.text()
      setPreview({
        name: file.name,
        mime: mime || 'text/plain',
        url: null,
        text,
      })
      return
    }

    if (isImagePreview || isPdfPreview) {
      setPreview({
        name: file.name,
        mime,
        url,
        text: null,
      })
      return
    }
    const downloadedIds = new Set(readDownloadedAttachmentIds())
    if (downloadedIds.has(file.id)) {
      URL.revokeObjectURL(url)
      toast('Файл уже загружен ранее. Откройте его из папки "Загрузки".')
      return
    }

    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    markAttachmentAsDownloaded(file.id)
    toast.success('Файл загружен в папку "Загрузки"')
    setTimeout(() => URL.revokeObjectURL(url), 5_000)
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
    <>
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
              if (task.column === 'assigned' && isAdmin && onAdminEditAssignedTask) {
                onAdminEditAssignedTask(task)
                return
              }
              if (task.column === 'in_progress') {
                setExpanded((p) => !p)
              }
            }}
          >
          <div className="flex gap-2">
            <div
              className="mt-0.5 cursor-grab text-slate-300 hover:text-slate-500"
              onClick={(e) => {
                if (task.column === 'assigned' && isAdmin && onAdminEditAssignedTask) {
                  e.stopPropagation()
                }
              }}
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              {descriptionAttachment && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    openAttachment(descriptionAttachment)
                  }}
                  className="mb-2 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-200"
                >
                  <Paperclip className="h-3 w-3" />
                  {descriptionAttachment.name}
                </button>
              )}
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
                    onClick={(e) => {
                      if (task.column === 'assigned' && isAdmin) e.stopPropagation()
                      setEditing(true)
                    }}
                    className={`inline-flex max-w-full flex-nowrap items-center gap-0.5 whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-medium ${
                      overdue ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span className="shrink-0">{formatDeadlineDisplay(task.deadline, task.dueTime)}</span>
                    {overdue && (
                      <span className="shrink-0 text-red-600">· просрочено</span>
                    )}
                    <Pencil className="h-3 w-3 shrink-0 opacity-0 transition group-hover:opacity-100" />
                  </button>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <AvatarStack users={assignees} />
                <div className="flex flex-wrap justify-end gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      if (task.column === 'assigned' && isAdmin) e.stopPropagation()
                      cyclePriority()
                    }}
                    className="rounded-lg px-2 py-1 text-xs text-teal-700 hover:bg-teal-50"
                  >
                    Приоритет
                  </button>
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

              {task.column === 'in_progress' && expanded && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <p className="mb-1 text-xs font-medium text-slate-600">Комментарий</p>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
                    value={currentReport?.comment ?? ''}
                    onChange={(e) =>
                      dispatch(
                        setAssigneeReportComment({
                          taskId: task.id,
                          userId: currentUserId,
                          comment: e.target.value,
                        }),
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div className="mt-2">
                    <p className="mb-1 text-xs font-medium text-slate-600">Файл отчета</p>
                    <input
                      type="file"
                      className="w-full text-xs"
                      onChange={(e) => onReportFileSelected(e.target.files?.[0] ?? undefined)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {currentReport?.attachments?.length ? (
                      <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2">
                        <p className="text-[11px] font-medium text-emerald-700">
                          Прикреплено: {currentReport.attachments.length}
                        </p>
                        <ul className="mt-1 space-y-1">
                          {currentReport.attachments.map((f) => (
                            <li key={f.id}>
                                <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  void openAttachment(f)
                                }}
                                className="truncate text-[11px] text-emerald-800 hover:underline"
                              >
                                • {f.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>

                  {task.checklistConfig?.report && (
                    <label className="mt-2 flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!task.checklistState?.report}
                        onChange={(e) =>
                          dispatch(
                            updateTask({
                              taskId: task.id,
                              patch: {
                                checklistState: {
                                  report: e.target.checked,
                                  familiarization: !!task.checklistState?.familiarization,
                                },
                              },
                            }),
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      Рапорт
                    </label>
                  )}
                  {task.checklistConfig?.familiarization && (
                    <label className="mt-1 flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!task.checklistState?.familiarization}
                        onChange={(e) =>
                          dispatch(
                            updateTask({
                              taskId: task.id,
                              patch: {
                                checklistState: {
                                  report: !!task.checklistState?.report,
                                  familiarization: e.target.checked,
                                },
                              },
                            }),
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      Лист ознакомления
                    </label>
                  )}

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

              <p className="mt-2 text-[10px] text-slate-400">Клик по дате — изменить срок исполнения</p>
            </div>
          </div>
          </div>
        )}
      </Draggable>

      {preview && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
          onClick={closePreview}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-900">{preview.name}</p>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Закрыть предпросмотр"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-auto p-4">
              {preview.text !== null && (
                <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-800">
                  {preview.text}
                </pre>
              )}
              {preview.text === null && preview.mime.startsWith('image/') && preview.url && (
                <img src={preview.url} alt={preview.name} className="mx-auto max-h-[70vh] rounded-lg" />
              )}
              {preview.text === null && preview.mime === 'application/pdf' && preview.url && (
                <iframe
                  src={preview.url}
                  className="h-[70vh] w-full rounded-lg border border-slate-200"
                  title={preview.name}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
