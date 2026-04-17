import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Board } from '@/types'

const boardsSlice = createSlice({
  name: 'boards',
  initialState: [] as Board[],
  reducers: {
    addBoard(state, action: PayloadAction<Board>) {
      state.push(action.payload)
    },
    removeBoard(state, action: PayloadAction<string>) {
      return state.filter((b) => b.id !== action.payload)
    },
    replaceBoards(_state, action: PayloadAction<Board[]>) {
      return action.payload
    },
  },
})

export const { addBoard, removeBoard, replaceBoards } = boardsSlice.actions
export default boardsSlice.reducer
