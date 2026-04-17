import type { RootState } from '@/store/rootReducer'

/** Экспорт для сброса с экрана входа */
export const STORAGE_KEY = 'workflow-automator-state-v1'

export function loadPersistedState(): Partial<RootState> | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    return JSON.parse(raw) as Partial<RootState>
  } catch {
    return undefined
  }
}

export function saveState(state: RootState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('workflow-automator: не удалось сохранить в localStorage', e)
  }
}

export function clearPersistedState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
