import { useState } from 'react'
import { Link } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import { FolderKanban, LogOut, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useAuth } from '@/hooks/useAuth'
import { logout } from '@/store/slices/authSlice'
import { addSpace } from '@/store/slices/spacesSlice'

export function SpacesPage() {
  const dispatch = useAppDispatch()
  const { user, isAdmin } = useAuth()
  const spaces = useAppSelector((s) => s.spaces)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  if (!user) return null

  const mySpaces = spaces.filter((sp) => sp.memberIds.includes(user.id))

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Введите название')
      return
    }
    const id = uuid()
    dispatch(
      addSpace({
        id,
        name: name.trim(),
        memberIds: [user.id],
      }),
    )
    toast.success('Пространство создано')
    setName('')
    setCreating(false)
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(rgba(248,250,252,0.9),rgba(248,250,252,0.9)),url('/workflow-bg.png')] bg-cover bg-center bg-fixed">
      <header className="border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 shadow">
              <FolderKanban className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">WorkflowAutomator</p>
              <p className="font-semibold text-slate-900">Пространства</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">
              {user.name}{' '}
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {user.role === 'admin' ? 'admin' : 'user'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => dispatch(logout())}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Ваши пространства</h1>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              Создать пространство
            </button>
          )}
        </div>

        {creating && (
          <form
            onSubmit={handleCreate}
            className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-teal-200 bg-white p-4 shadow-card"
          >
            <div className="min-w-[200px] flex-1">
              <label className="text-sm font-medium text-slate-700">Название</label>
              <input
                autoFocus
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Создать
            </button>
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              onClick={() => setCreating(false)}
            >
              Отмена
            </button>
          </form>
        )}

        <ul className="grid gap-4 sm:grid-cols-2">
          {mySpaces.map((s) => (
            <li key={s.id}>
              <Link
                to={`/spaces/${s.id}`}
                className="block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:border-teal-300 hover:shadow-card-hover"
              >
                <h2 className="text-lg font-semibold text-slate-900">{s.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Участников: {s.memberIds.length}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        {mySpaces.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-slate-600">
            Пока нет пространств.
            {isAdmin ? ' Создайте первое — кнопка выше.' : ' Администратор может добавить вас в пространство.'}
          </p>
        )}
      </main>
    </div>
  )
}
