import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UserListPage from './pages/users/UserListPage'
import RoleListPage from './pages/roles/RoleListPage'
import PermissionListPage from './pages/permissions/PermissionListPage'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes — wrapped in MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UserListPage />} />
        <Route path="/roles" element={<RoleListPage />} />
        <Route path="/permissions" element={<PermissionListPage />} />
      </Route>

      {/* Catch-all: redirect to dashboard (or login if not authed) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
