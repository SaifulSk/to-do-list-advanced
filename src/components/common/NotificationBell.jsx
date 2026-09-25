import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  Repeat, 
  Calendar, 
  CheckCheck, 
  CheckCircle2,
  Trash2, 
  Check, 
  Sparkles, 
  Flame, 
  X,
  Volume2
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow, parseISO } from 'date-fns';

export const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    permission, 
    requestPermission, 
    sendTestNotification,
    markAsRead, 
    markAllAsRead, 
    clearNotifications,
    checkNow 
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle2 size={15} color="var(--primary)" />;
      case 'due_tomorrow':
        return <Clock size={15} color="var(--primary)" />;
      case 'recurring_tomorrow':
        return <Repeat size={15} color="#8b5cf6" />;
      case 'daily_5h':
        return <Flame size={15} color="#f97316" />;
      case 'weekly_nodue':
        return <Calendar size={15} color="#06b6d4" />;
      default:
        return <Bell size={15} color="var(--primary)" />;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

  return (
    <div className="notification-bell-container" ref={containerRef}>
      <button 
        className={`btn-icon notification-bell-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Notifications & Reminders"
        type="button"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="notification-badge-count">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-dropdown-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="notification-unread-pill">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {unreadCount > 0 && (
                <button 
                  className="btn-icon-subtle" 
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                </button>
              )}
              <button 
                className="btn-icon-subtle" 
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* iOS Safari Home Screen Requirement Guide */}
          {isIOS && !isStandalone && (
            <div style={{ padding: '8px 12px', background: 'rgba(99, 102, 241, 0.08)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.71875rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
              <strong>📱 iPhone Notification Setup:</strong> Apple requires adding to Home Screen. Tap Safari Share (⬆️) &rarr; <strong>"Add to Home Screen"</strong>, then open Zenith from your Home Screen.
            </div>
          )}

          {/* Permission / Test Alert Controls */}
          {permission !== 'granted' && permission !== 'unsupported' ? (
            <div className="notification-permission-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Volume2 size={13} color="var(--primary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Enable iPhone Push Alerts</span>
              </div>
              <button 
                className="btn btn-primary notification-perm-btn"
                onClick={requestPermission}
                type="button"
              >
                Allow
              </button>
            </div>
          ) : (
            <div style={{ padding: '6px 12px', background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                ✓ Push alerts active
              </span>
              <button
                type="button"
                className="btn-link-subtle"
                style={{ fontSize: '0.6875rem', color: 'var(--primary)', fontWeight: 600, padding: 0 }}
                onClick={() => sendTestNotification()}
              >
                Send Test Alert
              </button>
            </div>
          )}

          {/* List */}
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={24} style={{ opacity: 0.3, marginBottom: '6px' }} />
                <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  All caught up!
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Due date and recurrence reminders will appear here.
                </span>
              </div>
            ) : (
              notifications.map((item) => (
                <div 
                  key={item.id}
                  className={`notification-item ${!item.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(item.id)}
                >
                  <div className="notification-item-icon">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="notification-item-content">
                    <div className="notification-item-title">
                      <span>{item.title}</span>
                      {!item.read && <span className="notification-dot" />}
                    </div>
                    <p className="notification-item-msg">{item.message}</p>
                    <span className="notification-item-time">{formatTime(item.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notification-dropdown-footer">
              <button 
                className="btn-link-subtle"
                onClick={clearNotifications}
                type="button"
              >
                <Trash2 size={12} />
                <span>Clear history</span>
              </button>

              <button 
                className="btn-link-subtle"
                onClick={() => checkNow()}
                title="Check notification rules now"
                type="button"
              >
                <Sparkles size={12} />
                <span>Check rules now</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
