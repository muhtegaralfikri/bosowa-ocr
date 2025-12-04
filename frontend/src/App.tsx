import type { JSX } from 'react';
import { Navigate, Outlet, Route, BrowserRouter, Routes } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import DeleteRequestsPage from './pages/DeleteRequestsPage';
import LetterDetailPage from './pages/LetterDetailPage';
import LettersFormPage from './pages/LettersFormPage';
import LettersListPage from './pages/LettersListPage';
import LoginPage from './pages/LoginPage';
import StatsPage from './pages/StatsPage';
import UploadPage from './pages/UploadPage';

function ProtectedRoute({
  children,
  roles,
}: {
  children: JSX.Element;
  roles?: string[];
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
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
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/upload" replace />} />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/letters/new"
              element={
                <ProtectedRoute>
                  <LettersFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/letters"
              element={
                <ProtectedRoute>
                  <LettersListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/letters/:id"
              element={
                <ProtectedRoute>
                  <LetterDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/delete-requests"
              element={
                <ProtectedRoute>
                  <DeleteRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <StatsPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
