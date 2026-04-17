import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/guards/RequireAuth'
import { LoginPage } from '@/pages/LoginPage'
import { SpacesPage } from '@/pages/SpacesPage'
import { SpaceDetailPage } from '@/pages/SpaceDetailPage'
import { BoardPage } from '@/pages/BoardPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/spaces" element={<SpacesPage />} />
        <Route path="/spaces/:spaceId" element={<SpaceDetailPage />} />
        <Route path="/spaces/:spaceId/board/:boardId" element={<BoardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
