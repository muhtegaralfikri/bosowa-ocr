import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const visibleNavItems = navItems.filter((item) => {
    if (item.path === '/stats' && user?.role !== 'ADMIN') return false;
    return true;
  });
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <img src={logo} alt="Bosowa Bandar Agency" className="brand-logo" />
        </div>
        <nav>
          {visibleNavItems.map((item) => (
            <Link key={item.path} to={item.path}>
              {item.label}
            </Link>
          ))}
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
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <Icon className="mobile-nav-icon" aria-hidden="true" />
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
