import { v4 as uuid } from 'uuid'
import type { AppState, Board, Space, Task, User } from '@/types'

const adminId = uuid()
const userId = uuid()
const user2Id = uuid()

const demoUsers: User[] = [
  {
    id: adminId,
    email: 'admin@demo.local',
    name: 'Админ Демо',
    password: 'admin',
    role: 'admin',
  },
  {
    id: userId,
    email: 'user@demo.local',
    name: 'Иван Разработчик',
    password: 'user',
    role: 'user',
  },
  {
    id: user2Id,
    email: 'maria@demo.local',
    name: 'Мария Аналитик',
    password: 'user',
    role: 'user',
  },
]

const spaceId = uuid()
const boardId = uuid()

const demoSpaces: Space[] = [
  {
    id: spaceId,
    name: 'Продукт — отчёты Q1',
    memberIds: [adminId, userId, user2Id],
  },
]

const demoBoards: Board[] = [
  {
    id: boardId,
    spaceId,
    name: 'Релиз портала',
  },
]

const demoTasks: Task[] = [
  {
    id: uuid(),
    boardId,
    column: 'assigned',
    description: 'Подготовить шаблон отчёта по продажам и согласовать с отделом.',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    priority: 'high',
    assigneeIds: [userId],
    order: 0,
  },
  {
    id: uuid(),
    boardId,
    column: 'in_progress',
    description: 'Загрузить подписанные документы в архив и приложить скан.',
    deadline: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    priority: 'medium',
    assigneeIds: [userId],
    order: 0,
    reportComment: 'Черновик отчёта прикреплён.',
  },
  {
    id: uuid(),
    boardId,
    column: 'completed',
    description: 'Сверка реестра задач с Jira.',
    deadline: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10),
    priority: 'low',
    assigneeIds: [user2Id],
    order: 0,
    reportComment: 'Готово.',
  },
]

/** Начальное состояние с демо-данными (1 пространство, 1 доска, 3 задачи) */
export function getSeedState(): AppState {
  return {
    auth: { currentUserId: null },
    users: demoUsers,
    spaces: demoSpaces,
    boards: demoBoards,
    tasks: demoTasks,
  }
}
