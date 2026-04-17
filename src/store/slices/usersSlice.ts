import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/types'

const usersSlice = createSlice({
  name: 'users',
  initialState: [] as User[],
  reducers: {
    addUser(state, action: PayloadAction<User>) {
      if (state.some((u) => u.email.toLowerCase() === action.payload.email.toLowerCase())) {
        return
      }
      state.push(action.payload)
    },
    /** Обновление профиля при необходимости */
    replaceUsers(_state, action: PayloadAction<User[]>) {
      return action.payload
    },
  },
})

export const { addUser, replaceUsers } = usersSlice.actions
export default usersSlice.reducer
