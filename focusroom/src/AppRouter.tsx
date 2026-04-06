import { Navigate, Route, Routes } from 'react-router-dom'

import App from './App'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import { ArcadeModePage } from './pages/ArcadeMode'
import { DashboardPage } from './pages/Dashboard'
import { FocusRoomsPage } from './pages/FocusRooms'
import { LoginPage } from './pages/Login'
import { RecordsPage } from './pages/Records'
import { RoomPage } from './pages/Room'
import { SidebarFeaturePage } from './pages/SidebarFeaturePage'
import { SignupPage } from './pages/Signup'
import { SudokuGame } from './pages/games/SudokuGame'
import { QueensGame } from './pages/games/QueensGame'

function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <p className="text-sm text-[var(--muted)]">Loading session...</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route
        path="/login"
        element={(
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        )}
      />
      <Route
        path="/signup"
        element={(
          <PublicOnlyRoute>
            <SignupPage />
          </PublicOnlyRoute>
        )}
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/study-planner"
          element={<SidebarFeaturePage title="Study Planner" description="Organize your focus sessions, revision blocks, and weekly study goals." />}
        />
        <Route path="/smart-room" element={<FocusRoomsPage />} />
        <Route path="/focus-rooms" element={<FocusRoomsPage />} />
        <Route path="/room/:id" element={<RoomPage />} />
        <Route
          path="/nearby-educators"
          element={<SidebarFeaturePage title="Nearby Educators" description="Discover mentors, tutors, and peer educators near your learning goals." />}
        />
        <Route
          path="/analytics-leaderboard"
          element={<SidebarFeaturePage title="Analytics an Leaderboard" description="Track progress trends, focus consistency, and competitive rankings." />}
        />
        <Route
          path="/ai-assistant"
          element={<SidebarFeaturePage title="Ai Assistant" description="Ask for study plans, topic breakdowns, and adaptive revision guidance." />}
        />
        <Route
          path="/arcade-mode"
          element={<ArcadeModePage />}
        />
        <Route
          path="/arcade-mode/sudoku"
          element={<SudokuGame />}
        />
        <Route
          path="/arcade-mode/queens"
          element={<QueensGame />}
        />
        <Route path="/records" element={<RecordsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
