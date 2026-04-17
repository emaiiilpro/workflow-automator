import type { User } from '@/types'

export function AvatarStack({ users, max = 4 }: { users: User[]; max?: number }) {
  const shown = users.slice(0, max)
  const rest = users.length - max

  return (
    <div className="flex -space-x-2">
      {shown.map((u) => (
        <div
          key={u.id}
          title={u.name}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-teal-500 to-blue-600 text-xs font-semibold text-white shadow-sm"
        >
          {u.name.slice(0, 1).toUpperCase()}
        </div>
      ))}
      {rest > 0 && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-medium text-slate-700">
          +{rest}
        </div>
      )}
    </div>
  )
}
