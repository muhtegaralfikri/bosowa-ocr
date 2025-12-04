import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  History,
  LineChart,
  LogOut,
  Menu,
  Trash2,
  Upload,
  Users,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const visibleNavItems = navItems.filter((item) => {
    if (item.adminOnly && user?.role !== 'ADMIN') return false;
    return true;
  });

  const mobileMainItems = visibleNavItems.slice(0, 3);
  const mobileMoreItems = visibleNavItems.slice(3);
  const hasMoreItems = mobileMoreItems.length > 0;

  const handleMobileMenuClose = () => setMobileMenuOpen(false);

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

      {/* Mobile Bottom Bar */}
      <nav className="mobile-bottom-bar">
        {mobileMainItems.map((item) => {
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
        {hasMoreItems && (
          <button
            type="button"
            className="mobile-nav-item"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="mobile-nav-icon" aria-hidden="true" />
            <span className="mobile-nav-label">Lainnya</span>
          </button>
        )}
      </nav>

      {/* Mobile More Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={handleMobileMenuClose}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <span>Menu Lainnya</span>
              <button type="button" onClick={handleMobileMenuClose}>
                <X size={20} />
              </button>
            </div>
            <div className="mobile-menu-items">
              {mobileMoreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`mobile-menu-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={handleMobileMenuClose}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <button
                type="button"
                className="mobile-menu-link logout"
                onClick={() => {
                  handleMobileMenuClose();
                  logout();
                }}
              >
                <LogOut size={20} />
                <span>Keluar</span>
              </button>
            </div>
            {user && (
              <div className="mobile-menu-user">
                <span>{user.username}</span>
                <span className="mobile-menu-role">{user.role}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
