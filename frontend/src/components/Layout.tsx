import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="dot" />
          <span>Bosowa Bandar Agency</span>
        </div>
        <nav>
          <Link to="/upload">Upload</Link>
          <Link to="/letters">Daftar Surat</Link>
          <Link to="/delete-requests">Delete Request</Link>
          <Link to="/stats">Stats</Link>
        </nav>
        <div className="user-box">
          {user ? (
            <>
              <span className="user-role">{user.role}</span>
              <button type="button" onClick={logout} className="ghost-btn">
                Keluar
              </button>
            </>
          ) : (
            <Link to="/login" className="ghost-btn">
              Login
            </Link>
          )}
        </div>
      </header>
      <main className="app-content">{children}</main>
    </div>
  );
}
