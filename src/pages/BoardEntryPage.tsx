import { useEffect, useMemo, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useAuth } from '@/hooks/useAuth'
import { addBoard } from '@/store/slices/boardsSlice'
import { addSpace } from '@/store/slices/spacesSlice'

export function BoardEntryPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const createdRef = useRef(false)
  const { user, isAdmin } = useAuth()
  const spaces = useAppSelector((s) => s.spaces)
  const boards = useAppSelector((s) => s.boards)

  const visibleSpaces = useMemo(
    () => spaces.filter((space) => isAdmin || (user ? space.memberIds.includes(user.id) : false)),
    [spaces, isAdmin, user],
  )

  const targetBoard = useMemo(() => {
    for (const space of visibleSpaces) {
      const board = boards.find((item) => item.spaceId === space.id)
      if (board) return board
    }
    return null
  }, [boards, visibleSpaces])

  useEffect(() => {
    if (!user || !isAdmin || targetBoard || createdRef.current) return

    createdRef.current = true
    const fallbackSpace = visibleSpaces[0]
    const spaceId = fallbackSpace?.id ?? uuid()
    const boardId = uuid()

    if (!fallbackSpace) {
      dispatch(
        addSpace({
          id: spaceId,
          name: 'Новое пространство',
          memberIds: [user.id],
        }),
      )
    }

    dispatch(
      addBoard({
        id: boardId,
        spaceId,
        name: 'Новая доска',
        memberIds: fallbackSpace?.memberIds ?? [user.id],
      }),
    )
    navigate(`/spaces/${spaceId}/board/${boardId}`, { replace: true })
  }, [dispatch, isAdmin, navigate, targetBoard, user, visibleSpaces])

  if (targetBoard) {
    return <Navigate to={`/spaces/${targetBoard.spaceId}/board/${targetBoard.id}`} replace />
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h1 className="text-lg font-semibold text-slate-900">Нет доступной доски</h1>
          <p className="mt-2 text-sm text-slate-600">
            Попросите администратора добавить вас в пространство с доской.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
      Загрузка доски...
    </div>
  )
}
