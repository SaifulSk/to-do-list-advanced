import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useTasks } from './TaskContext';
import { 
  evaluateTaskNotifications, 
  fireNativeNotification, 
  markTriggerSent, 
  getStoredInAppNotifications, 
  saveStoredInAppNotifications, 
  requestNotificationPermission 
} from '../services/notificationService';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { tasks } = useTasks();
  const [notifications, setNotifications] = useState(() => getStoredInAppNotifications());
  const [activeToast, setActiveToast] = useState(null);
  const [permission, setPermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'unsupported';
  });

  const toastTimerRef = useRef(null);

  // Sync notifications to localStorage
  useEffect(() => {
    saveStoredInAppNotifications(notifications);
  }, [notifications]);

  // Request browser permission
  const handleRequestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  // Dismiss toast banner
  const dismissToast = useCallback(() => {
    setActiveToast(null);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  // Show a notification toast
  const showToast = useCallback((notification) => {
    setActiveToast(notification);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setActiveToast(null);
      toastTimerRef.current = null;
    }, 6000);
  }, []);

  // Core Rule Engine Evaluation
  const runNotificationCheck = useCallback(() => {
    if (!tasks || tasks.length === 0) return;

    const matched = evaluateTaskNotifications(tasks);
    if (matched.length > 0) {
      // Mark all as sent
      matched.forEach((n) => {
        markTriggerSent(n.triggerKey);
        fireNativeNotification(n);
      });

      // Prepend to in-app notification list
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const filteredNew = matched.filter((item) => !existingIds.has(item.id));
        return [...filteredNew, ...prev].slice(0, 50);
      });

      // Show toast for latest notification
      showToast(matched[0]);
    }
  }, [tasks, showToast]);

  // Listen for real-time dispatched notifications (e.g. task completed)
  useEffect(() => {
    const handleDispatched = (event) => {
      const notif = event.detail;
      if (!notif) return;

      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [notif, ...prev].slice(0, 50);
      });

      showToast(notif);
    };

    window.addEventListener('zenith_notification', handleDispatched);
    return () => {
      window.removeEventListener('zenith_notification', handleDispatched);
    };
  }, [showToast]);

  // Check on tasks update and every 60 seconds
  useEffect(() => {
    runNotificationCheck();

    const intervalId = setInterval(() => {
      runNotificationCheck();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [runNotificationCheck]);

  // Mark single as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) => 
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Trigger a test notification to verify mobile/desktop delivery
  const sendTestNotification = useCallback(async () => {
    let currentPerm = permission;
    if (currentPerm !== 'granted') {
      currentPerm = await handleRequestPermission();
    }

    if (currentPerm === 'granted') {
      const testNotif = {
        id: `test-${Date.now()}`,
        triggerKey: `test-${Date.now()}`,
        taskId: 'test-device',
        title: '🔔 Push Notifications Working!',
        message: 'Your device is configured to receive instant task completion alerts.',
        type: 'task_completed',
        taskTitle: 'Push Notifications Active',
        timestamp: new Date().toISOString(),
        read: false
      };

      await fireNativeNotification(testNotif);
      setNotifications((prev) => [testNotif, ...prev].slice(0, 50));
      showToast(testNotif);
      return { success: true };
    } else {
      showToast({
        title: '⚠️ Permission Blocked',
        message: 'Notification permission is required. Check browser/phone site settings.',
        type: 'due_tomorrow'
      });
      return { success: false, permission: currentPerm };
    }
  }, [permission, handleRequestPermission, showToast]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    activeToast,
    permission,
    requestPermission: handleRequestPermission,
    sendTestNotification,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    checkNow: runNotificationCheck
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
