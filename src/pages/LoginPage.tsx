import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import toast from 'react-hot-toast'
import { ClipboardList } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginSuccess } from '@/store/slices/authSlice'
import { addUser } from '@/store/slices/usersSlice'
import type { Role } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { clearPersistedState } from '@/store/localStorage'

export function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAuth()
  const users = useAppSelector((s) => s.users)

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('user')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const pwd = password.trim()
    const u = users.find(
      (x) =>
        x.email.toLowerCase() === email.trim().toLowerCase() && x.password === pwd,
    )
    if (!u) {
      toast.error('Неверный email или пароль')
      return
    }
    dispatch(loginSuccess({ userId: u.id }))
    toast.success(`Добро пожаловать, ${u.name}`)
    navigate('/spaces')
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Введите имя')
      return
    }
    if (users.some((x) => x.email.toLowerCase() === email.trim().toLowerCase())) {
      toast.error('Пользователь с таким email уже есть')
      return
    }
    const id = uuid()
    dispatch(
      addUser({
        id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        password: password.trim(),
        role,
      }),
    )
    dispatch(loginSuccess({ userId: id }))
    toast.success('Аккаунт создан')
    navigate('/spaces')
  }

  if (isAuthenticated) {
    return <Navigate to="/spaces" replace />
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(rgba(248,250,252,0.88),rgba(248,250,252,0.88)),url('/workflow-bg.png')] bg-cover bg-center bg-fixed px-4">
      <div className="mb-8 flex items-center gap-3 text-slate-900">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 shadow-lg">
          <ClipboardList className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WorkflowAutomator</h1>
          <p className="text-sm text-slate-600">Процессы, отчёты и документы</p>
        </div>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/90 p-8 shadow-xl backdrop-blur">
        <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              mode === 'login' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
            }`}
            onClick={() => setMode('login')}
          >
            Вход
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              mode === 'register' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
            }`}
            onClick={() => setMode('register')}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700">Имя</label>
                <input
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Роль</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              required
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Пароль</label>
            <input
              required
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg hover:from-teal-700 hover:to-blue-700"
          >
            {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Демо: admin@demo.local / admin · user@demo.local / user
        </p>
        <button
          type="button"
          className="mt-3 w-full text-center text-xs text-teal-700 underline decoration-teal-400/60 hover:text-teal-900"
          onClick={() => {
            clearPersistedState()
            window.location.reload()
          }}
        >
          Не получается войти? Сбросить локальные данные и вернуть демо
        </button>
      </div>
    </div>
  )
}
