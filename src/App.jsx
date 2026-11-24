import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/ui/ErrorBoundary'
import Navbar from './components/layout/Navbar'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/Dashboard'
import SceneEditor from './pages/SceneEditor'
import DAWPage from './pages/DAWPage'
import PlayGame from './pages/PlayGame'
import PublicMusicPage from './pages/PublicMusicPage'
import ExplorePage from './pages/ExplorePage'
import MyPublicationsPage from './pages/MyPublicationsPage'
import NotFoundPage from './pages/NotFoundPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="animate-pulse text-text-secondary font-mono text-sm">Loading...</div>
      </div>
    )
  }
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-bg text-text">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<><Navbar /><LandingPage /></>} />
          <Route path="/login" element={<><Navbar /><LoginPage /></>} />
          <Route path="/signup" element={<><Navbar /><SignupPage /></>} />

          {/* Explore — public, no auth required */}
          <Route path="/explore" element={<ExplorePage />} />

          {/* Public game player */}
          <Route path="/play/:projectId" element={<PlayGame />} />

          {/* Public music player */}
          <Route path="/music/:trackId" element={<PublicMusicPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Navbar /><Dashboard /></ProtectedRoute>} />
          <Route path="/my-publications" element={<ProtectedRoute><MyPublicationsPage /></ProtectedRoute>} />
          <Route path="/daw" element={<ProtectedRoute><DAWPage /></ProtectedRoute>} />
          <Route path="/project/:projectId/editor" element={<ProtectedRoute><SceneEditor /></ProtectedRoute>} />
          <Route path="/project/:projectId/daw" element={<ProtectedRoute><DAWPage /></ProtectedRoute>} />
          <Route path="/project/:projectId/daw/:trackId" element={<ProtectedRoute><DAWPage /></ProtectedRoute>} />

          <Route path="*" element={<><Navbar /><NotFoundPage /></>} />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}
