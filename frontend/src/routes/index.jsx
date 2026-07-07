import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Documents from '@/pages/Documents'
import Chat from '@/pages/Chat'
import Quiz from '@/pages/Quiz'
import Flashcards from '@/pages/Flashcards'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Guest routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={<GuestRoute><Login /></GuestRoute>}
        />
        <Route
          path="/register"
          element={<GuestRoute><Register /></GuestRoute>}
        />
      </Route>

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:sessionId" element={<Chat />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz/:quizId" element={<Quiz />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/flashcards/:documentId" element={<Flashcards />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
