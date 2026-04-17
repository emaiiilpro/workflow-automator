import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, FileText, Paperclip } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import toast from 'react-hot-toast'
import type { Task } from '@/types'
import { useAppDispatch } from '@/store/hooks'
import { appendReportAttachment, setAssigneeReportComment } from '@/store/slices/tasksSlice'

type Props = {
  task: Task
  currentUserId: string
  onClose: () => void
}

/** Модалка отчёта: файлы (base64), комментарий, завершение через перенос в «Выполненные» на доске */
export function TaskReportModal({ task, currentUserId, onClose }: Props) {
  const dispatch = useAppDispatch()
  const currentReport = task.assigneeReports?.[currentUserId]

  const onDrop = useCallback(
    (accepted: File[]) => {
      accepted.forEach((file) => {
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
          toast.success(`Файл «${file.name}» прикреплён`)
        }
        reader.readAsDataURL(file)
      })
    },
    [dispatch, task.id, currentUserId],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="pr-10 text-lg font-semibold text-slate-900">Отчёт по задаче</h2>
        <p className="mt-1 text-sm text-slate-600 line-clamp-3">{task.description}</p>

        <label className="mt-4 block text-sm font-medium text-slate-700">Комментарий</label>
        <textarea
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          rows={4}
          value={currentReport?.comment ?? ''}
          placeholder="Что сделано, ссылки, заметки…"
          onChange={(e) =>
            dispatch(
              setAssigneeReportComment({
                taskId: task.id,
                userId: currentUserId,
                comment: e.target.value,
              }),
            )
          }
        />

        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
          <Paperclip className="h-4 w-4" />
          Вложения (хранятся как data URL в LocalStorage)
        </p>
        <div
          {...getRootProps()}
          className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm transition ${
            isDragActive ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'
          }`}
        >
          <input {...getInputProps()} />
          <FileText className="mb-2 h-8 w-8 text-slate-400" />
          Перетащите файлы сюда или нажмите для выбора
        </div>

        {currentReport?.attachments && currentReport.attachments.length > 0 && (
          <ul className="mt-3 space-y-2">
            {currentReport.attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="truncate">{a.name}</span>
                {a.mime.startsWith('image/') && (
                  <img src={a.dataBase64} alt="" className="ml-2 h-10 w-10 rounded object-cover" />
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-xs text-slate-500">После заполнения отчета отметьте себя в карточке.</p>
      </div>
    </div>
  )
}
