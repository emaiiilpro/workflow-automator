import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Board, CustomBoardColumn } from '@/types'

const boardsSlice = createSlice({
  name: 'boards',
  initialState: [] as Board[],
  reducers: {
    addBoard(state, action: PayloadAction<Board>) {
      state.push(action.payload)
    },
    addCustomColumn(
      state,
      action: PayloadAction<{ boardId: string; column: CustomBoardColumn }>,
    ) {
      const board = state.find((b) => b.id === action.payload.boardId)
      if (!board) return
      if (!board.customColumns) board.customColumns = []
      board.customColumns.push(action.payload.column)
    },
    setBoardMembers(
      state,
      action: PayloadAction<{ boardId: string; memberIds: string[] }>,
    ) {
      const board = state.find((b) => b.id === action.payload.boardId)
      if (!board) return
      board.memberIds = Array.from(new Set(action.payload.memberIds))
    },
    setSpaceBoardsMembers(
      state,
      action: PayloadAction<{ spaceId: string; memberIds: string[] }>,
    ) {
      const nextIds = Array.from(new Set(action.payload.memberIds))
      state.forEach((board) => {
        if (board.spaceId !== action.payload.spaceId) return
        board.memberIds = nextIds
      })
    },
    removeCustomColumn(
      state,
      action: PayloadAction<{ boardId: string; columnId: CustomBoardColumn['id'] }>,
    ) {
      const board = state.find((b) => b.id === action.payload.boardId)
      if (!board?.customColumns) return
      board.customColumns = board.customColumns.filter((c) => c.id !== action.payload.columnId)
      board.customColumns.forEach((column, index) => {
        column.order = index
      })
    },
    removeBoard(state, action: PayloadAction<string>) {
      return state.filter((b) => b.id !== action.payload)
    },
    replaceBoards(_state, action: PayloadAction<Board[]>) {
      return action.payload
    },
  },
})

export const {
  addBoard,
  addCustomColumn,
  setBoardMembers,
  setSpaceBoardsMembers,
  removeCustomColumn,
  removeBoard,
  replaceBoards,
} =
  boardsSlice.actions
export default boardsSlice.reducer
