import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Space } from '@/types'

const spacesSlice = createSlice({
  name: 'spaces',
  initialState: [] as Space[],
  reducers: {
    addSpace(state, action: PayloadAction<Space>) {
      state.push(action.payload)
    },
    removeSpace(state, action: PayloadAction<string>) {
      return state.filter((s) => s.id !== action.payload)
    },
    addMemberToSpace(
      state,
      action: PayloadAction<{ spaceId: string; userId: string }>,
    ) {
      const space = state.find((s) => s.id === action.payload.spaceId)
      if (!space) return
      if (!space.memberIds.includes(action.payload.userId)) {
        space.memberIds.push(action.payload.userId)
      }
    },
    replaceSpaces(_state, action: PayloadAction<Space[]>) {
      return action.payload
    },
  },
})

export const { addSpace, removeSpace, addMemberToSpace, replaceSpaces } = spacesSlice.actions
export default spacesSlice.reducer
