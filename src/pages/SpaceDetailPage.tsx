import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import toast from 'react-hot-toast'
import { ArrowLeft, KanbanSquare, Trash2, UserPlus } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useAuth } from '@/hooks/useAuth'
import { addBoard, removeBoard } from '@/store/slices/boardsSlice'
import { addMemberToSpace, removeSpace } from '@/store/slices/spacesSlice'
import { addUser } from '@/store/slices/usersSlice'
import { removeTasksByBoard } from '@/store/slices/tasksSlice'

export function SpaceDetailPage() {
  const { spaceId } = useParams<{ spaceId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user, isAdmin } = useAuth()
  const spaces = useAppSelector((s) => s.spaces)
  const boards = useAppSelector((s) => s.boards)
  const users = useAppSelector((s) => s.users)

  const [boardName, setBoardName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberName, setMemberName] = useState('')

  const space = spaces.find((s) => s.id === spaceId)

  if (!user || !spaceId) return null

  if (!space || !space.memberIds.includes(user.id)) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Нет доступа к пространству</p>
        <Link to="/spaces" className="mt-2 inline-block text-teal-700 underline">
          К списку
        </Link>
      </div>
    )
  }

  const spaceBoards = boards.filter((b) => b.spaceId === space.id)

  const addBoardHandler = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return
    if (!boardName.trim()) {
      toast.error('Введите название доски')
      return
    }
    dispatch(
      addBoard({
        id: uuid(),
        spaceId: space.id,
        name: boardName.trim(),
      }),
    )
    setBoardName('')
    toast.success('Доска создана')
  }

  const deleteBoard = (id: string) => {
    if (!isAdmin) return
    if (!confirm('Удалить доску и все задачи?')) return
    dispatch(removeTasksByBoard(id))
    dispatch(removeBoard(id))
    toast.success('Доска удалена')
  }

  const deleteSpace = () => {
    if (!isAdmin) return
    if (!confirm('Удалить пространство, все доски и задачи?')) return
    spaceBoards.forEach((b) => {
      dispatch(removeTasksByBoard(b.id))
      dispatch(removeBoard(b.id))
    })
    dispatch(removeSpace(space.id))
    toast.success('Пространство удалено')
    navigate('/spaces')
  }

  const addMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return
    const email = memberEmail.trim().toLowerCase()
    if (!email || !memberName.trim()) {
      toast.error('Укажите email и имя')
      return
    }
    const existing = users.find((u) => u.email.toLowerCase() === email)
    if (existing) {
      if (space.memberIds.includes(existing.id)) {
        toast.error('Этот пользователь уже в пространстве')
        return
      }
      dispatch(addMemberToSpace({ spaceId: space.id, userId: existing.id }))
      toast.success('Участник добавлен')
    } else {
      const id = uuid()
      dispatch(
        addUser({
          id,
          email,
          name: memberName.trim(),
          password: 'invite',
          role: 'user',
        }),
      )
      dispatch(addMemberToSpace({ spaceId: space.id, userId: id }))
      toast.success('Создан пользователь и добавлен в пространство (пароль: invite)')
    }
    setMemberEmail('')
    setMemberName('')
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(rgba(248,250,252,0.9),rgba(248,250,252,0.9)),url('/workflow-bg.png')] bg-cover bg-center bg-fixed">
      <header className="border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/spaces"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Пространства
            </Link>
            <h1 className="text-xl font-bold text-slate-900">{space.name}</h1>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={deleteSpace}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Удалить пространство
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
        {isAdmin && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <UserPlus className="h-5 w-5 text-teal-600" />
              Участники пространства
            </h2>
            <form onSubmit={addMember} className="mt-4 flex flex-wrap gap-3">
              <input
                placeholder="Email"
                type="email"
                className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
              />
              <input
                placeholder="Имя"
                className="min-w-[160px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
              />
              <button
                type="submit"
                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Добавить
              </button>
            </form>
            <ul className="mt-4 flex flex-wrap gap-2">
              {space.memberIds.map((id) => {
                const u = users.find((x) => x.id === id)
                if (!u) return null
                return (
                  <li
                    key={id}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800"
                  >
                    {u.name}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900">Доски</h2>
              {isAdmin && (
                <form onSubmit={addBoardHandler} className="flex flex-wrap gap-2">
                  <input
                    placeholder="Название доски"
                    className="min-w-[200px] rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Создать доску
                  </button>
                </form>
              )}
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {spaceBoards.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <KanbanSquare className="mt-0.5 h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-slate-900">{b.name}</h3>
                      <Link
                        to={`/spaces/${space.id}/board/${b.id}`}
                        className="mt-2 inline-flex text-sm font-medium text-teal-700 hover:underline"
                      >
                        Открыть Kanban →
                      </Link>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => deleteBoard(b.id)}
                      className="mt-4 self-end text-xs text-red-600 hover:underline"
                    >
                      Удалить доску
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {spaceBoards.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600">
                Досок пока нет.
                {isAdmin && ' Создайте первую доску.'}
              </p>
            )}
        </section>
      </main>
    </div>
  )
}
