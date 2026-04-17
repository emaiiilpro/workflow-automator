import { useMemo } from 'react'
import { useAppSelector } from '@/store/hooks'
import type { User } from '@/types'

export function useAuth(): {
  currentUserId: string | null
  user: User | null
  isAdmin: boolean
  isAuthenticated: boolean
} {
  const currentUserId = useAppSelector((s) => s.auth.currentUserId)
  const users = useAppSelector((s) => s.users)

  const user = useMemo(
    () => (currentUserId ? users.find((u) => u.id === currentUserId) ?? null : null),
    [currentUserId, users],
  )

  return {
    currentUserId,
    user,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
  }
}
