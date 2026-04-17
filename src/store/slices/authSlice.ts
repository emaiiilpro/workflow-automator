import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthState } from '@/types'

const initialState: AuthState = {
  currentUserId: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ userId: string }>) {
      state.currentUserId = action.payload.userId
    },
    logout(state) {
      state.currentUserId = null
    },
  },
})

export const { loginSuccess, logout } = authSlice.actions
export default authSlice.reducer
