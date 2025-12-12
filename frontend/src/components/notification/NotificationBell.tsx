import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, FileSignature, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../api/signatures';

export default function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: isOpen,
  });

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif: (typeof notifications)[0]) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    if (notif.type === 'SIGNATURE_REQUEST' && notif.referenceId) {
      navigate('/pending-signatures');
    }
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SIGNATURE_REQUEST':
        return <FileSignature size={16} className="notif-icon request" />;
      case 'SIGNATURE_COMPLETED':
        return <Check size={16} className="notif-icon success" />;
      case 'SIGNATURE_REJECTED':
        return <X size={16} className="notif-icon danger" />;
      default:
        return <Bell size={16} />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString('id-ID');
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button className="bell-button" onClick={() => setIsOpen(!isOpen)}>
        <Bell size={20} />
        {unreadCount > 0 && <span className="badge-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <span>Notifikasi</span>
            {notifications.some((n) => !n.isRead) && (
              <button className="mark-all-btn" onClick={() => markAllMutation.mutate()}>
                Tandai semua dibaca
              </button>
            )}
          </div>
          <div className="dropdown-body">
            {notifications.length === 0 ? (
              <p className="empty-notif">Tidak ada notifikasi</p>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-item ${notif.isRead ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  {getIcon(notif.type)}
                  <div className="notif-content">
                    <p className="notif-title">{notif.title}</p>
                    <p className="notif-message">{notif.message}</p>
                    <span className="notif-time">{formatTime(notif.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .notification-bell {
          position: relative;
        }
        .bell-button {
          position: relative;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          color: white;
        }
        .bell-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .badge-count {
          position: absolute;
          top: 0;
          right: 0;
          background: #ef4444;
          color: white;
          font-size: 0.65rem;
          font-weight: bold;
          padding: 0.1rem 0.35rem;
          border-radius: 9999px;
          min-width: 1.1rem;
          text-align: center;
        }
        .notification-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          width: 320px;
          max-height: 400px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          overflow: hidden;
        }
        @media (max-width: 400px) {
          .notification-dropdown {
            width: 280px;
            left: -10px;
          }
        }
        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 600;
        }
        .mark-all-btn {
          background: transparent;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-size: 0.75rem;
        }
        .dropdown-body {
          max-height: 320px;
          overflow-y: auto;
        }
        .empty-notif {
          padding: 2rem;
          text-align: center;
          color: #666;
        }
        .notif-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: background 0.2s;
        }
        .notif-item:hover {
          background: #f9fafb;
        }
        .notif-item.unread {
          background: #eff6ff;
        }
        .notif-icon {
          flex-shrink: 0;
          margin-top: 0.2rem;
        }
        .notif-icon.request { color: #3b82f6; }
        .notif-icon.success { color: #22c55e; }
        .notif-icon.danger { color: #ef4444; }
        .notif-content {
          flex: 1;
          min-width: 0;
        }
        .notif-title {
          font-weight: 600;
          font-size: 0.875rem;
          margin: 0;
        }
        .notif-message {
          font-size: 0.8rem;
          color: #666;
          margin: 0.25rem 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .notif-time {
          font-size: 0.7rem;
          color: #999;
        }
      `}</style>
    </div>
  );
}
