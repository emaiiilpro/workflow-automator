/** Роли: глобальная регистрация */
export type Role = 'admin' | 'user'

export type Priority = 'low' | 'medium' | 'high'

/** Колонки Kanban (фиксированный порядок слева направо) */
export type BaseTaskColumn = 'assigned' | 'in_progress' | 'completed'
export type TaskColumn = BaseTaskColumn | `custom_${string}`

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
  /** Участники, прикрепленные к этой доске */
  memberIds?: string[]
  customColumns?: CustomBoardColumn[]
}

export interface CustomBoardColumn {
  id: `custom_${string}`
  title: string
  order: number
}

export interface TaskAttachment {
  id: string
  name: string
  mime: string
  /** data URL или чистый base64 — храним как в ТЗ для LocalStorage */
  dataBase64: string
}

export interface AssigneeReport {
  comment?: string
  attachments: TaskAttachment[]
  completed: boolean
}

export interface TaskChecklistConfig {
  report: boolean
  familiarization: boolean
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
  /** Файл, прикрепленный админом при создании в поле описания */
  descriptionAttachment?: TaskAttachment
  /** Настраиваемые поля карточки, заданные при создании */
  checklistConfig?: TaskChecklistConfig
  /** Состояние чеклиста карточки */
  checklistState?: TaskChecklistConfig
  reportComment?: string
  reportAttachments?: TaskAttachment[]
  /** Отчеты по каждому исполнителю в задаче */
  assigneeReports?: Record<string, AssigneeReport>
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
