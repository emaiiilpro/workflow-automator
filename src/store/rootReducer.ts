import { combineReducers } from '@reduxjs/toolkit'
import authReducer from '@/store/slices/authSlice'
import usersReducer from '@/store/slices/usersSlice'
import spacesReducer from '@/store/slices/spacesSlice'
import boardsReducer from '@/store/slices/boardsSlice'
import tasksReducer from '@/store/slices/tasksSlice'

const rootReducer = combineReducers({
  auth: authReducer,
  users: usersReducer,
  spaces: spacesReducer,
  boards: boardsReducer,
  tasks: tasksReducer,
})

export type RootState = ReturnType<typeof rootReducer>
export default rootReducer
