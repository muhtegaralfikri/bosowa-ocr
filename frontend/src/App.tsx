import type { JSX } from 'react';
import { Navigate, Outlet, Route, BrowserRouter, Routes } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuditLogPage from './pages/AuditLogPage';
import DeleteRequestsPage from './pages/DeleteRequestsPage';
import LetterDetailPage from './pages/LetterDetailPage';
import LettersFormPage from './pages/LettersFormPage';
import LettersListPage from './pages/LettersListPage';
import LoginPage from './pages/LoginPage';
import StatsPage from './pages/StatsPage';
import UploadPage from './pages/UploadPage';
import UsersPage from './pages/UsersPage';

function ProtectedRoute({
  children,
  roles,
}: {
  children: JSX.Element;
  roles?: string[];
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/masuk" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/masuk" replace />;
  return children;
}

function AppShell() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/masuk" element={<LoginPage />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/unggah" replace />} />
            <Route
              path="/unggah"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surat/baru"
              element={
                <ProtectedRoute>
                  <LettersFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surat"
              element={
                <ProtectedRoute>
                  <LettersListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surat/:id"
              element={
                <ProtectedRoute>
                  <LetterDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/permintaan-hapus"
              element={
                <ProtectedRoute>
                  <DeleteRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistik"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <StatsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-log"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AuditLogPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
