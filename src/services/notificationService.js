// Zenith Todo — Notification Service & Rules Engine
import { 
  differenceInCalendarDays, 
  parseISO, 
  isValid, 
  format, 
  startOfDay 
} from 'date-fns';

const SENT_KEYS_STORAGE = 'zenith_sent_notifications';
const IN_APP_STORAGE = 'zenith_in_app_notifications';

/**
 * Reads sent notification trigger keys from localStorage
 */
export function getSentTriggerKeys() {
  try {
    const raw = localStorage.getItem(SENT_KEYS_STORAGE);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Saves a trigger key to prevent duplicate notifications
 */
export function markTriggerSent(key) {
  try {
    const keys = getSentTriggerKeys();
    keys[key] = new Date().toISOString();
    // Prune keys older than 30 days to keep storage clean
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    for (const [k, timestamp] of Object.entries(keys)) {
      if (new Date(timestamp).getTime() < thirtyDaysAgo) {
        delete keys[k];
      }
    }
    localStorage.setItem(SENT_KEYS_STORAGE, JSON.stringify(keys));
  } catch (e) {
    console.warn('Could not persist sent notification key', e);
  }
}

/**
 * Reads in-app notification history
 */
export function getStoredInAppNotifications() {
  try {
    const raw = localStorage.getItem(IN_APP_STORAGE);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Saves in-app notification history (capped at 50)
 */
export function saveStoredInAppNotifications(notifications) {
  try {
    localStorage.setItem(IN_APP_STORAGE, JSON.stringify(notifications.slice(0, 50)));
  } catch (e) {
    console.warn('Could not persist in-app notifications', e);
  }
}

/**
 * Request Web Notification permissions
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.warn('Error requesting notification permission:', e);
    return 'denied';
  }
}

/**
 * Checks all tasks against the user's notification rules:
 * 1. Todos having no due date: Push notification every week.
 * 2. Todos having due date: Push notification the day before.
 * 3. Recurring todos (except everyday): Push notification the day before.
 * 4. Everyday recurring todos: Push notification 5 hours before next day (at or after 19:00).
 */
export function evaluateTaskNotifications(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) return [];

  const now = new Date();
  const currentHour = now.getHours(); // 0 to 23
  const todayDateStr = format(now, 'yyyy-MM-dd');
  const currentWeekStr = format(now, 'yyyy-ww');
  const sentKeys = getSentTriggerKeys();

  const newNotifications = [];

  for (const task of tasks) {
    // Only notify for uncompleted tasks
    if (task.status === 'completed') continue;

    const isDaily = task.recurrence === 'daily';
    const isRecurringNonDaily = task.recurrence && task.recurrence !== 'none' && !isDaily;
    const hasDueDate = Boolean(task.dueDate);

    // RULE 1: Everyday recurring ones -> Push 5 hours before next day (7 PM / 19:00 or later)
    if (isDaily) {
      if (currentHour >= 19) {
        const triggerKey = `daily-5h-${task.id}-${todayDateStr}`;
        if (!sentKeys[triggerKey]) {
          newNotifications.push({
            id: triggerKey,
            triggerKey,
            taskId: task.id,
            title: 'Daily Task Reminder (Evening)',
            message: `"${task.title}" is scheduled for today. 5 hours remaining before tomorrow!`,
            type: 'daily_5h',
            taskTitle: task.title,
            timestamp: new Date().toISOString(),
            read: false
          });
        }
      }
      continue;
    }

    // RULE 2 & 3: Todos with due date (standard or non-daily recurring) -> Push notification the day before
    if (hasDueDate) {
      try {
        const dueDate = parseISO(task.dueDate);
        if (isValid(dueDate)) {
          const daysUntilDue = differenceInCalendarDays(dueDate, now);

          // Exactly 1 day before due date
          if (daysUntilDue === 1) {
            const triggerKey = isRecurringNonDaily 
              ? `recurring-tomorrow-${task.id}-${task.dueDate}`
              : `due-tomorrow-${task.id}-${task.dueDate}`;

            if (!sentKeys[triggerKey]) {
              const ruleTitle = isRecurringNonDaily
                ? `Recurring Task Due Tomorrow (${task.recurrence})`
                : 'Task Due Tomorrow';
              
              const ruleMessage = isRecurringNonDaily
                ? `"${task.title}" repeats ${task.recurrence} and is due tomorrow (${format(dueDate, 'MMM d')})!`
                : `"${task.title}" is due tomorrow (${format(dueDate, 'MMM d')})!`;

              newNotifications.push({
                id: triggerKey,
                triggerKey,
                taskId: task.id,
                title: ruleTitle,
                message: ruleMessage,
                type: isRecurringNonDaily ? 'recurring_tomorrow' : 'due_tomorrow',
                taskTitle: task.title,
                timestamp: new Date().toISOString(),
                read: false
              });
            }
          }
        }
      } catch (e) {
        // invalid date ignored
      }
    } else {
      // RULE 4: Todos having NO due date -> Push notification every week
      // Check if task is at least 7 days old or notify on a weekly cycle
      let canNotifyWeekly = true;
      if (task.createdAt) {
        try {
          const created = parseISO(task.createdAt);
          if (isValid(created)) {
            const daysSinceCreated = differenceInCalendarDays(now, created);
            if (daysSinceCreated < 7) {
              canNotifyWeekly = false; // Don't notify brand new tasks created today/yesterday until 1 week
            }
          }
        } catch (e) {
          // fallback
        }
      }

      if (canNotifyWeekly) {
        const triggerKey = `weekly-noduedate-${task.id}-${currentWeekStr}`;
        if (!sentKeys[triggerKey]) {
          newNotifications.push({
            id: triggerKey,
            triggerKey,
            taskId: task.id,
            title: 'Weekly Reminder: Unscheduled Task',
            message: `"${task.title}" has no due date set. Review or schedule it!`,
            type: 'weekly_nodue',
            taskTitle: task.title,
            timestamp: new Date().toISOString(),
            read: false
          });
        }
      }
    }
  }

  return newNotifications;
}

/**
 * Fires a native browser notification if permissions are granted
 */
export function fireNativeNotification(notification) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const n = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.triggerKey
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch (e) {
    console.warn('Native notification failed:', e);
  }
}

/**
 * Triggers a push notification immediately when a task is completed.
 * Fires native Web Notification API, records in in-app storage, and dispatches a custom event.
 */
export function notifyTaskCompleted(task) {
  if (!task) return null;

  const now = new Date();
  const triggerKey = `task-completed-${task.id}-${now.getTime()}`;
  const notification = {
    id: triggerKey,
    triggerKey,
    taskId: task.id,
    title: '🎉 Task Completed!',
    message: `"${task.title}" has been marked as completed!`,
    type: 'task_completed',
    taskTitle: task.title,
    timestamp: now.toISOString(),
    read: false
  };

  // 1. Native Web Notification
  fireNativeNotification(notification);

  // 2. Persist in in-app notification history
  try {
    const existing = getStoredInAppNotifications();
    saveStoredInAppNotifications([notification, ...existing]);
  } catch (e) {
    console.warn('Could not store completion notification', e);
  }

  // 3. Dispatch window event for NotificationContext / active toasts
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zenith_notification', { detail: notification }));
  }

  return notification;
}
