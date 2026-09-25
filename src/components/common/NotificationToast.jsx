import React from 'react';
import { X, Clock, Repeat, Flame, Calendar, Bell, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export const NotificationToast = () => {
  const { activeToast, dismissToast } = useNotifications();

  if (!activeToast) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle2 size={16} color="var(--primary)" />;
      case 'due_tomorrow':
        return <Clock size={16} color="var(--primary)" />;
      case 'recurring_tomorrow':
        return <Repeat size={16} color="#8b5cf6" />;
      case 'daily_5h':
        return <Flame size={16} color="#f97316" />;
      case 'weekly_nodue':
        return <Calendar size={16} color="#06b6d4" />;
      default:
        return <Bell size={16} color="var(--primary)" />;
    }
  };

  return (
    <div className="notification-toast-container">
      <div className="notification-toast">
        <div className="notification-toast-icon">
          {getIcon(activeToast.type)}
        </div>
        <div className="notification-toast-body">
          <h4 className="notification-toast-title">{activeToast.title}</h4>
          <p className="notification-toast-msg">{activeToast.message}</p>
        </div>
        <button 
          className="notification-toast-close"
          onClick={dismissToast}
          title="Dismiss notification"
          type="button"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
