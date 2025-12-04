import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FileText, LineChart, Trash2, Upload } from 'lucide-react';
import logo from '../assets/bosowa-agensi.png';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/upload', label: 'Upload', icon: Upload },
  { path: '/letters', label: 'Daftar', icon: FileText },
  { path: '/delete-requests', label: 'Delete', icon: Trash2 },
  { path: '/stats', label: 'Stats', icon: LineChart },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <img src={logo} alt="Bosowa Bandar Agency" className="brand-logo" />
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
      <nav className="mobile-bottom-bar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className="mobile-nav-item">
              <Icon className="mobile-nav-icon" aria-hidden="true" />
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
