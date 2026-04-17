import { configureStore } from '@reduxjs/toolkit'
import rootReducer from '@/store/rootReducer'
import type { RootState } from '@/store/rootReducer'
import { getSeedState } from '@/store/seed'
import { loadPersistedState, saveState } from '@/store/localStorage'

function buildPreloadedState(): RootState {
  const seed = getSeedState()
  const p = loadPersistedState()
  if (!p) {
    return seed as RootState
  }
  return {
    auth: p.auth ?? seed.auth,
    users: p.users !== undefined ? p.users : seed.users,
    spaces: p.spaces !== undefined ? p.spaces : seed.spaces,
    boards: p.boards !== undefined ? p.boards : seed.boards,
    tasks: p.tasks !== undefined ? p.tasks : seed.tasks,
  } as RootState
}

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: buildPreloadedState(),
})

store.subscribe(() => {
  saveState(store.getState())
})

export type AppDispatch = typeof store.dispatch
export type { RootState }
