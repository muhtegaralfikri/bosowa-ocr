import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  History,
  LineChart,
  LogOut,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import logo from '../assets/bosowa-agensi.png';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/unggah', label: 'Unggah', icon: Upload },
  { path: '/surat', label: 'Daftar Surat', icon: FileText },
  { path: '/permintaan-hapus', label: 'Permintaan Hapus', icon: Trash2 },
  { path: '/statistik', label: 'Statistik', icon: LineChart, adminOnly: true },
  { path: '/users', label: 'Kelola User', icon: Users, adminOnly: true },
  { path: '/audit-log', label: 'Audit Log', icon: History, adminOnly: true },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const visibleNavItems = navItems.filter((item) => {
    if (item.adminOnly && user?.role !== 'ADMIN') return false;
    return true;
  });

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="Bosowa Bandar Agency" className="sidebar-logo" />
        </div>

        <nav className="sidebar-nav">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-user-info">
                <span className="sidebar-username">{user.username}</span>
                <span className="sidebar-role">{user.role}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="sidebar-logout"
                title="Keluar"
              >
                <LogOut size={20} />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">{children}</main>

      <nav className="mobile-bottom-bar">
        {visibleNavItems.slice(0, 4).map((item) => {
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
