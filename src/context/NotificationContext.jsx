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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    activeToast,
    permission,
    requestPermission: handleRequestPermission,
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
