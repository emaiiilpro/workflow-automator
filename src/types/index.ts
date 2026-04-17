/** Роли: глобальная регистрация */
export type Role = 'admin' | 'user'

export type Priority = 'low' | 'medium' | 'high'

/** Колонки Kanban (фиксированный порядок слева направо) */
export type TaskColumn = 'assigned' | 'in_progress' | 'completed'

export interface User {
  id: string
  email: string
  name: string
  /** Демо: пароль в открытом виде только для локального прототипа */
  password: string
  role: Role
}

export interface Space {
  id: string
  name: string
  /** Участники пространства */
  memberIds: string[]
}

export interface Board {
  id: string
  spaceId: string
  name: string
}

export interface TaskAttachment {
  id: string
  name: string
  mime: string
  /** data URL или чистый base64 — храним как в ТЗ для LocalStorage */
  dataBase64: string
}

export interface Task {
  id: string
  boardId: string
  column: TaskColumn
  description: string
  /** ISO date (yyyy-MM-dd) */
  deadline: string
  priority: Priority
  assigneeIds: string[]
  /** Порядок внутри колонки для DnD */
  order: number
  reportComment?: string
  reportAttachments?: TaskAttachment[]
}

export interface AuthState {
  currentUserId: string | null
}

export interface AppState {
  auth: AuthState
  users: User[]
  spaces: Space[]
  boards: Board[]
  tasks: Task[]
}
