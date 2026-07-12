import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UserListPage from './pages/users/UserListPage'
import RoleListPage from './pages/roles/RoleListPage'
import PermissionListPage from './pages/permissions/PermissionListPage'
import ProviderListPage from './pages/providers/ProviderListPage'
import ModelListPage from './pages/models/ModelListPage'
import PromptListPage from './pages/prompts/PromptListPage'
import KnowledgeBaseListPage from './pages/knowledge/KnowledgeBaseListPage'
import ToolListPage from './pages/tools/ToolListPage'
import AgentListPage from './pages/agents/AgentListPage'
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
        <Route path="/providers" element={<ProviderListPage />} />
        <Route path="/model-mgmt" element={<ModelListPage />} />
        <Route path="/prompts" element={<PromptListPage />} />
        <Route path="/knowledge" element={<KnowledgeBaseListPage />} />
        <Route path="/tools" element={<ToolListPage />} />
        <Route path="/agents" element={<AgentListPage />} />
      </Route>

      {/* Catch-all: redirect to dashboard (or login if not authed) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
