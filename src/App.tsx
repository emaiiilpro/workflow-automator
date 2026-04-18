import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/guards/RequireAuth'
import { LoginPage } from '@/pages/LoginPage'
import { BoardPage } from '@/pages/BoardPage'
import { BoardEntryPage } from '@/pages/BoardEntryPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/board" element={<BoardEntryPage />} />
        <Route path="/spaces/:spaceId/board/:boardId" element={<BoardPage />} />
        <Route path="/spaces" element={<Navigate to="/board" replace />} />
        <Route path="/spaces/:spaceId" element={<Navigate to="/board" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
