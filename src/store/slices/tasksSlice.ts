import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Task, TaskAttachment, TaskColumn } from '@/types'

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: [] as Task[],
  reducers: {
    addTask(state, action: PayloadAction<Task>) {
      state.push(action.payload)
    },
    updateTask(
      state,
      action: PayloadAction<{
        taskId: string
        patch: Partial<Task>
      }>,
    ) {
      const t = state.find((x) => x.id === action.payload.taskId)
      if (!t) return
      const { patch } = action.payload
      Object.assign(t, patch)
      if (Object.prototype.hasOwnProperty.call(patch, 'dueTime') && !patch.dueTime) {
        delete t.dueTime
      }
    },
    setTaskColumn(
      state,
      action: PayloadAction<{ taskId: string; column: TaskColumn; order: number }>,
    ) {
      const t = state.find((x) => x.id === action.payload.taskId)
      if (!t) return
      t.column = action.payload.column
      t.order = action.payload.order
    },
    /** Перестановка порядка внутри колонки */
    reorderInColumn(
      state,
      action: PayloadAction<{ boardId: string; column: TaskColumn; orderedIds: string[] }>,
    ) {
      const { boardId, column, orderedIds } = action.payload
      orderedIds.forEach((id, index) => {
        const t = state.find((x) => x.id === id && x.boardId === boardId && x.column === column)
        if (t) t.order = index
      })
    },
    appendReportAttachment(
      state,
      action: PayloadAction<{ taskId: string; userId: string; file: TaskAttachment }>,
    ) {
      const t = state.find((x) => x.id === action.payload.taskId)
      if (!t) return
      if (!t.reportAttachments) t.reportAttachments = []
      t.reportAttachments.push(action.payload.file)
      if (!t.assigneeReports) t.assigneeReports = {}
      if (!t.assigneeReports[action.payload.userId]) {
        t.assigneeReports[action.payload.userId] = { attachments: [], completed: false }
      }
      t.assigneeReports[action.payload.userId].attachments.push(action.payload.file)
    },
    setAssigneeReportComment(
      state,
      action: PayloadAction<{ taskId: string; userId: string; comment: string }>,
    ) {
      const t = state.find((x) => x.id === action.payload.taskId)
      if (!t) return
      if (!t.assigneeReports) t.assigneeReports = {}
      if (!t.assigneeReports[action.payload.userId]) {
        t.assigneeReports[action.payload.userId] = { attachments: [], completed: false }
      }
      t.assigneeReports[action.payload.userId].comment = action.payload.comment
    },
    setAssigneeCompleted(
      state,
      action: PayloadAction<{ taskId: string; userId: string; completed: boolean }>,
    ) {
      const t = state.find((x) => x.id === action.payload.taskId)
      if (!t) return
      if (!t.assigneeReports) t.assigneeReports = {}
      if (!t.assigneeReports[action.payload.userId]) {
        t.assigneeReports[action.payload.userId] = { attachments: [], completed: false }
      }
      t.assigneeReports[action.payload.userId].completed = action.payload.completed
    },
    removeTask(state, action: PayloadAction<string>) {
      return state.filter((t) => t.id !== action.payload)
    },
    /** Удаление всех задач доски (при удалении доски) */
    removeTasksByBoard(state, action: PayloadAction<string>) {
      return state.filter((t) => t.boardId !== action.payload)
    },
    removeTasksByBoardColumn(
      state,
      action: PayloadAction<{ boardId: string; column: TaskColumn }>,
    ) {
      return state.filter(
        (task) =>
          !(task.boardId === action.payload.boardId && task.column === action.payload.column),
      )
    },
    replaceTasks(_state, action: PayloadAction<Task[]>) {
      return action.payload
    },
  },
})

export const {
  addTask,
  updateTask,
  setTaskColumn,
  reorderInColumn,
  appendReportAttachment,
  setAssigneeReportComment,
  setAssigneeCompleted,
  removeTask,
  removeTasksByBoard,
  removeTasksByBoardColumn,
  replaceTasks,
} = tasksSlice.actions
export default tasksSlice.reducer
