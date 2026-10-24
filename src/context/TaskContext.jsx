import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { format, addDays, addWeeks, addMonths, addYears, parseISO, isValid, getDate, getMonth } from 'date-fns';
import { useAuth } from './AuthContext';
import { 
  isConfigured as isFirebaseLive, 
  subscribeToUserTasks,
  claimLegacyTodosForSaiful,
  addTaskToFirestore,
  updateTaskInFirestore,
  deleteTaskFromFirestore,
  subscribeToAssignees,
  addAssigneeToFirestore,
  deleteAssigneeFromFirestore
} from '../services/firebase';
import { notifyTaskCompleted } from '../services/notificationService';

const TaskContext = createContext(null);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

// Check if a recurring task is scheduled on a given date (yyyy-MM-dd)
export function isTaskScheduledOnDate(task, dateStr) {
  if (!task || !task.recurrence || task.recurrence === 'none') return false;

  // 1. Creation date boundary: task appears on or after its creation date
  if (task.createdAt && dateStr < task.createdAt) {
    return false;
  }

  // 2. Stopped recurrence boundary: if stopped prior to dateStr, do not show
  if (task.isRecurringStopped) {
    if (task.recurrenceStoppedAt && dateStr > task.recurrenceStoppedAt) {
      return false;
    }
  }

  const targetDate = parseISO(dateStr);
  if (!isValid(targetDate)) return false;

  switch (task.recurrence) {
    case 'daily':
      return true;

    case 'weekly': {
      const targetDayName = format(targetDate, 'EEEE').toLowerCase();
      const taskDay = (task.recurringDayOfWeek || '').toLowerCase();
      if (taskDay) {
        return taskDay === targetDayName;
      }
      const fallbackDate = task.dueDate ? parseISO(task.dueDate) : (task.createdAt ? parseISO(task.createdAt) : null);
      if (fallbackDate && isValid(fallbackDate)) {
        return format(fallbackDate, 'EEEE').toLowerCase() === targetDayName;
      }
      return false;
    }

    case 'monthly': {
      const targetDayOfMonth = getDate(targetDate);
      let taskDay = Number(task.recurringDayOfMonth);
      if (!taskDay || isNaN(taskDay)) {
        const fallbackDate = task.dueDate ? parseISO(task.dueDate) : (task.createdAt ? parseISO(task.createdAt) : null);
        if (fallbackDate && isValid(fallbackDate)) {
          taskDay = getDate(fallbackDate);
        }
      }
      return targetDayOfMonth === taskDay;
    }

    case 'yearly': {
      const targetMonth = getMonth(targetDate) + 1;
      const targetDay = getDate(targetDate);
      let taskMonth = Number(task.recurringMonth);
      let taskDay = Number(task.recurringDayOfMonth);
      if (!taskMonth || !taskDay || isNaN(taskMonth) || isNaN(taskDay)) {
        const fallbackDate = task.dueDate ? parseISO(task.dueDate) : (task.createdAt ? parseISO(task.createdAt) : null);
        if (fallbackDate && isValid(fallbackDate)) {
          taskMonth = getMonth(fallbackDate) + 1;
          taskDay = getDate(fallbackDate);
        }
      }
      return targetMonth === taskMonth && targetDay === taskDay;
    }

    default:
      return false;
  }
}

const LOCAL_TASKS_KEY = 'zenith_user_tasks';
const LOCAL_ASSIGNEES_KEY = 'zenith_assignees_master';

export const TaskProvider = ({ children }) => {
  const { currentUser, isFirebaseConnected } = useAuth();

  const userKey = currentUser ? currentUser.uid : 'guest';

  // Tasks state scoped to current user
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(`zenith_user_tasks_${userKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading saved tasks:', e);
    }
    return [];
  });

  // Switch tasks state when currentUser changes (prevents account bleed)
  useEffect(() => {
    const currentKey = currentUser ? currentUser.uid : 'guest';
    try {
      const saved = localStorage.getItem(`zenith_user_tasks_${currentKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTasks(parsed);
          prevTasksRef.current = parsed;
          return;
        }
      }
    } catch (e) {
      // ignore
    }
    setTasks([]);
    prevTasksRef.current = [];
  }, [currentUser?.uid]);

  // Assignees Master state
  const [assignees, setAssignees] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_ASSIGNEES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading saved assignees:', e);
    }
    return [];
  });

  const [loading, setLoading] = useState(false);

  // Filters state
  const [taskTypeTab, setTaskTypeTab] = useState('normal'); // 'normal' | 'recurring'
  const [recurringDate, setRecurringDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all'); // all, urgent, high, medium, low
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, completed
  const [filterNeedHelp, setFilterNeedHelp] = useState(false); // boolean
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate'); // dueDate, createdAt, priority, title
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // Sync to local storage for backup
  useEffect(() => {
    const currentKey = currentUser ? currentUser.uid : 'guest';
    try {
      localStorage.setItem(`zenith_user_tasks_${currentKey}`, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Could not persist tasks to localStorage', e);
    }
  }, [tasks, currentUser?.uid]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_ASSIGNEES_KEY, JSON.stringify(assignees));
    } catch (e) {
      console.warn('Could not persist assignees to localStorage', e);
    }
  }, [assignees]);

  const prevTasksRef = useRef(tasks);
  const isInitialTasksSyncRef = useRef(true);

  // Real-time Firestore sync for Tasks (Strictly isolated by user)
  useEffect(() => {
    if (!isFirebaseConnected || !currentUser) {
      if (!currentUser) setLoading(false);
      return;
    }

    setLoading(true);

    // If logging in as saiful@yopmail.com, claim any legacy todos to this user's UID
    if (currentUser.email === 'saiful@yopmail.com') {
      claimLegacyTodosForSaiful(currentUser.uid).catch((err) => {
        console.warn('Could not claim todos for saiful:', err);
      });
    }

    const unsubscribe = subscribeToUserTasks(
      currentUser.uid,
      (firestoreTasks) => {
        if (Array.isArray(firestoreTasks)) {
          // Detect remote completions across devices (e.g. Desktop -> Mobile PWA)
          if (!isInitialTasksSyncRef.current && prevTasksRef.current && prevTasksRef.current.length > 0) {
            const prevMap = new Map(prevTasksRef.current.map((t) => [t.id, t]));
            firestoreTasks.forEach((incomingTask) => {
              const prevTask = prevMap.get(incomingTask.id);
              if (prevTask && prevTask.status !== 'completed' && incomingTask.status === 'completed') {
                notifyTaskCompleted(incomingTask);
              }
            });
          } else if (isInitialTasksSyncRef.current) {
            // On initial load or app resume: check if any task was completed recently (last 30 mins)
            // that this device has not notified yet
            firestoreTasks.forEach((incomingTask) => {
              if (incomingTask.status === 'completed' && incomingTask.completedAt) {
                try {
                  const compTime = parseISO(incomingTask.completedAt.replace(' ', 'T')).getTime();
                  const diffMin = (Date.now() - compTime) / (1000 * 60);
                  if (diffMin >= 0 && diffMin <= 30) {
                    notifyTaskCompleted(incomingTask);
                  }
                } catch (e) {
                  // ignore
                }
              }
            });
          }

          prevTasksRef.current = firestoreTasks;
          isInitialTasksSyncRef.current = false;
          setTasks(firestoreTasks);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Firestore subscription fallback:', error);
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isFirebaseConnected, currentUser?.uid, currentUser?.email]);

  // Real-time Firestore sync for Assignees Master
  useEffect(() => {
    if (!isFirebaseConnected) return;

    const unsubscribe = subscribeToAssignees(
      (firestoreAssignees) => {
        if (Array.isArray(firestoreAssignees)) {
          setAssignees(firestoreAssignees);
        }
      },
      (error) => {
        console.warn('Firestore assignees fallback to local:', error);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isFirebaseConnected]);

  // Assignee Master: Add Assignee
  const addAssignee = async (name, role = '') => {
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    const initials = cleanName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('') || cleanName.slice(0, 2).toUpperCase();

    const tempId = 'asn-' + Date.now();
    const newAssignee = {
      id: tempId,
      name: cleanName,
      role: role.trim() || '',
      avatar: initials,
      createdAt: new Date().toISOString()
    };

    // Update local state immediately
    setAssignees(prev => [...prev.filter(a => a.name.toLowerCase() !== cleanName.toLowerCase()), newAssignee]);

    // Persist to Firestore
    if (isFirebaseConnected) {
      try {
        const { id, ...dataToSave } = newAssignee;
        const docRef = await addAssigneeToFirestore(dataToSave);
        setAssignees(prev => prev.map(a => a.id === tempId ? { ...a, id: docRef.id } : a));
      } catch (err) {
        console.error('Firestore error saving assignee:', err);
      }
    }

    return newAssignee;
  };

  // Assignee Master: Delete Assignee
  const deleteAssignee = async (assigneeId) => {
    setAssignees(prev => prev.filter(a => a.id !== assigneeId));
    if (isFirebaseConnected) {
      try {
        await deleteAssigneeFromFirestore(assigneeId);
      } catch (err) {
        console.error('Firestore error deleting assignee:', err);
      }
    }
  };

  // Create Task (Optimistic UI, default status: 'todo')
  const addTask = async (taskData) => {
    const tempId = 'task-' + Date.now();
    const isCompleted = taskData.status === 'completed';
    const newTask = {
      ...taskData,
      id: tempId,
      createdAt: taskData.createdAt || format(new Date(), 'yyyy-MM-dd'),
      status: taskData.status || 'todo',
      completedAt: isCompleted ? (taskData.completedAt || format(new Date(), 'yyyy-MM-dd HH:mm')) : null,
      userId: currentUser ? currentUser.uid : 'user-local',
      userEmail: currentUser?.email || 'user-local'
    };

    // Instantly update local state
    setTasks((prev) => [newTask, ...prev.filter(t => t.id !== tempId)]);
    if (prevTasksRef.current) {
      prevTasksRef.current = [newTask, ...prevTasksRef.current.filter(t => t.id !== tempId)];
    }

    // Persist to Firestore
    if (isFirebaseConnected) {
      try {
        const { id, ...cleanData } = newTask;
        const docRef = await addTaskToFirestore(cleanData);
        setTasks((prev) => prev.map(t => t.id === tempId ? { ...t, id: docRef.id } : t));
        if (prevTasksRef.current) {
          prevTasksRef.current = prevTasksRef.current.map(t => t.id === tempId ? { ...t, id: docRef.id } : t);
        }
        newTask.id = docRef.id;
      } catch (err) {
        console.error('Firestore write error, keeping local task:', err);
      }
    }

    return newTask;
  };

  // Update Task (Optimistic UI)
  const updateTask = async (taskId, updates) => {
    const existingTask = tasks.find((t) => t.id === taskId);
    const finalUpdates = { ...updates };
    const isBecomingCompleted = 
      finalUpdates.status === 'completed' && 
      (!existingTask || existingTask.status !== 'completed');

    if (finalUpdates.status === 'completed' && finalUpdates.completedAt === undefined) {
      finalUpdates.completedAt = format(new Date(), 'yyyy-MM-dd HH:mm');
    } else if (finalUpdates.status && finalUpdates.status !== 'completed' && finalUpdates.completedAt === undefined) {
      finalUpdates.completedAt = null;
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...finalUpdates } : t)));
    if (prevTasksRef.current) {
      prevTasksRef.current = prevTasksRef.current.map((t) => (t.id === taskId ? { ...t, ...finalUpdates } : t));
    }

    // Trigger push notification on todo completion
    if (isBecomingCompleted && existingTask) {
      notifyTaskCompleted({ ...existingTask, ...finalUpdates });
    }

    if (isFirebaseConnected) {
      try {
        await updateTaskInFirestore(taskId, finalUpdates);
      } catch (err) {
        console.error('Firestore update error, keeping local changes:', err);
      }
    }
  };

  // Delete Task (Optimistic UI)
  const deleteTask = async (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (prevTasksRef.current) {
      prevTasksRef.current = prevTasksRef.current.filter((t) => t.id !== taskId);
    }
    if (isFirebaseConnected) {
      try {
        await deleteTaskFromFirestore(taskId);
      } catch (err) {
        console.error('Firestore delete error:', err);
      }
    }
  };

  // Toggle In-Progress status for a task
  const toggleTaskInProgress = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Toggle between in_progress and todo
    const newStatus = task.status === 'in_progress' ? 'todo' : 'in_progress';
    await updateTask(taskId, { status: newStatus, completedAt: null });
  };

  // Toggle Task Completion (with celebratory confetti)
  const toggleTaskComplete = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const isNowCompleted = task.status !== 'completed';
    const newStatus = isNowCompleted ? 'completed' : 'todo';

    // Synchronize all steps to completed or incomplete
    let updatedSteps = task.steps;
    if (task.hasSteps && Array.isArray(task.steps) && task.steps.length > 0) {
      updatedSteps = task.steps.map((step) => ({
        ...step,
        completed: isNowCompleted
      }));
    }

    if (isNowCompleted) {
      try {
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#10b981', '#a855f7', '#38bdf8']
        });
      } catch (e) {
        // ignore
      }

      // If the task has a recurrence, automatically schedule/create the next occurrence!
      if (task.recurrence && task.recurrence !== 'none') {
        const baseDate = task.dueDate ? parseISO(task.dueDate) : new Date();
        const validBase = isValid(baseDate) ? baseDate : new Date();
        let nextDueDate;

        switch (task.recurrence) {
          case 'daily':
            nextDueDate = addDays(validBase, 1);
            break;
          case 'weekly':
            nextDueDate = addWeeks(validBase, 1);
            break;
          case 'monthly':
            nextDueDate = addMonths(validBase, 1);
            break;
          case 'yearly':
            nextDueDate = addYears(validBase, 1);
            break;
          default:
            nextDueDate = null;
        }

        const nextDateStr = nextDueDate ? format(nextDueDate, 'yyyy-MM-dd') : null;

        // Auto-spawn the next occurrence with the new due date and status 'todo'
        setTimeout(() => {
          addTask({
            title: task.title,
            description: task.description || '',
            priority: task.priority || 'medium',
            status: 'todo',
            dueDate: nextDateStr,
            createdAt: format(new Date(), 'yyyy-MM-dd'),
            assignedTo: task.assignedTo || null,
            needHelpFrom: task.needHelpFrom || null,
            tags: task.tags || [],
            recurrence: task.recurrence,
            amount: task.amount !== undefined ? task.amount : null,
            currency: task.currency || '₹',
            hasSteps: task.hasSteps || false,
            steps: Array.isArray(task.steps) ? task.steps.map(s => ({ ...s, completed: false })) : []
          });
        }, 150);
      }
    }

    const completedAt = isNowCompleted ? format(new Date(), 'yyyy-MM-dd HH:mm') : null;
    await updateTask(taskId, { 
      status: newStatus, 
      completedAt,
      ...(updatedSteps ? { steps: updatedSteps } : {})
    });
  };

  // Toggle individual step in multi-stepped task
  const toggleTaskStep = async (taskId, stepId, dateStr = null) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !Array.isArray(task.steps)) return;

    const isRecurring = Boolean(task.recurrence && task.recurrence !== 'none');

    if (isRecurring) {
      // For recurring tasks: steps are renewed each day!
      const targetDate = dateStr || recurringDate || format(new Date(), 'yyyy-MM-dd');
      const completedStepsByDate = { ...(task.completedStepsByDate || {}) };
      const currentSteps = Array.isArray(completedStepsByDate[targetDate]) 
        ? [...completedStepsByDate[targetDate]] 
        : [];

      let updatedStepsForDate;
      if (currentSteps.includes(stepId)) {
        updatedStepsForDate = currentSteps.filter((id) => id !== stepId);
      } else {
        updatedStepsForDate = [...currentSteps, stepId];
      }

      completedStepsByDate[targetDate] = updatedStepsForDate;

      // Synchronize completedDates for targetDate
      const completedDates = Array.isArray(task.completedDates) ? [...task.completedDates] : [];
      let updatedCompletedDates = completedDates;
      const totalSteps = task.steps.length;

      if (updatedStepsForDate.length === totalSteps && totalSteps > 0) {
        // All steps done on targetDate -> mark completed on targetDate!
        if (!completedDates.includes(targetDate)) {
          updatedCompletedDates = [...completedDates, targetDate];
          try {
            confetti({
              particleCount: 50,
              spread: 45,
              origin: { y: 0.8 },
              colors: ['#6366f1', '#10b981', '#a855f7', '#38bdf8']
            });
          } catch (e) {}
        }
      } else {
        // Not all steps done -> remove targetDate from completedDates
        updatedCompletedDates = completedDates.filter((d) => d !== targetDate);
      }

      await updateTask(taskId, {
        completedStepsByDate,
        completedDates: updatedCompletedDates
      });
      return;
    }

    // Normal (non-recurring) task: existing static steps logic
    const updatedSteps = task.steps.map((step) => {
      if (step.id === stepId) {
        return { ...step, completed: !step.completed };
      }
      return step;
    });

    const completedCount = updatedSteps.filter((s) => s.completed).length;
    const totalCount = updatedSteps.length;

    let newStatus = task.status;
    let completedAt = task.completedAt;

    if (completedCount === totalCount && totalCount > 0) {
      // All steps done -> task is fully completed
      newStatus = 'completed';
      completedAt = format(new Date(), 'yyyy-MM-dd HH:mm');
      try {
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#10b981', '#a855f7', '#38bdf8']
        });
      } catch (e) {}
    } else if (completedCount > 0) {
      // At least one step done, but not all -> AUTOMATICALLY IN PROGRESS!
      newStatus = 'in_progress';
      completedAt = null;
    } else {
      // 0 steps done -> revert to 'todo' if it was in_progress or completed
      if (task.status === 'in_progress' || task.status === 'completed') {
        newStatus = 'todo';
      }
      completedAt = null;
    }

    await updateTask(taskId, {
      steps: updatedSteps,
      status: newStatus,
      completedAt
    });
  };

  // Toggle recurring task completion on a specific date (yyyy-MM-dd)
  const toggleRecurringDateComplete = async (taskId, dateStr = null) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const targetDate = dateStr || recurringDate || format(new Date(), 'yyyy-MM-dd');
    const completedDates = Array.isArray(task.completedDates) ? [...task.completedDates] : [];
    const isCompletedForDate = completedDates.includes(targetDate);
    let updatedCompletedDates;
    const completedStepsByDate = { ...(task.completedStepsByDate || {}) };

    if (isCompletedForDate) {
      updatedCompletedDates = completedDates.filter((d) => d !== targetDate);
      completedStepsByDate[targetDate] = [];
    } else {
      updatedCompletedDates = [...completedDates, targetDate];
      if (Array.isArray(task.steps) && task.steps.length > 0) {
        completedStepsByDate[targetDate] = task.steps.map((s) => s.id);
      }
      try {
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#10b981', '#a855f7', '#38bdf8']
        });
      } catch (e) {}
    }

    await updateTask(taskId, {
      completedDates: updatedCompletedDates,
      completedStepsByDate,
      completedAt: !isCompletedForDate ? format(new Date(), 'yyyy-MM-dd HH:mm') : task.completedAt
    });
  };

  // Toggle stop / resume recurrence
  const toggleStopRecurrence = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const willBeStopped = !task.isRecurringStopped;
    const recurrenceStoppedAt = willBeStopped ? format(new Date(), 'yyyy-MM-dd') : null;

    await updateTask(taskId, {
      isRecurringStopped: willBeStopped,
      recurrenceStoppedAt
    });
  };

  // Normal vs Recurring tasks segmentation
  const normalTasks = useMemo(() => {
    return tasks.filter((t) => !t.recurrence || t.recurrence === 'none');
  }, [tasks]);

  const recurringTasks = useMemo(() => {
    return tasks.filter((t) => t.recurrence && t.recurrence !== 'none');
  }, [tasks]);

  // Filtered and Sorted Tasks (Filtered according to active tab: normal vs recurring on recurringDate)
  const filteredTasks = useMemo(() => {
    let baseTasks;
    if (taskTypeTab === 'normal') {
      baseTasks = normalTasks;
    } else {
      baseTasks = recurringTasks.filter((task) => isTaskScheduledOnDate(task, recurringDate));
    }

    return baseTasks
      .filter((task) => {
        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title?.toLowerCase().includes(q);
          const matchDesc = task.description?.toLowerCase().includes(q);
          const matchAssignee = task.assignedTo?.name?.toLowerCase().includes(q);
          const matchHelper = task.needHelpFrom?.name?.toLowerCase().includes(q);
          const matchTags = task.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchAssignee && !matchHelper && !matchTags) {
            return false;
          }
        }

        // Priority Filter
        if (filterPriority !== 'all' && task.priority !== filterPriority) {
          return false;
        }

        // Status Filter
        if (taskTypeTab === 'recurring') {
          const isDoneOnDate = Array.isArray(task.completedDates) && task.completedDates.includes(recurringDate);
          const stepsDoneCount = Array.isArray(task.completedStepsByDate?.[recurringDate]) ? task.completedStepsByDate[recurringDate].length : 0;
          const totalStepsCount = Array.isArray(task.steps) ? task.steps.length : 0;
          const isInProgressOnDate = !isDoneOnDate && stepsDoneCount > 0 && stepsDoneCount < totalStepsCount;

          if (filterStatus === 'todo' && (isDoneOnDate || isInProgressOnDate)) return false;
          if (filterStatus === 'in_progress' && !isInProgressOnDate) return false;
          if (filterStatus === 'active' && isDoneOnDate) return false;
          if (filterStatus === 'completed' && !isDoneOnDate) return false;
        } else {
          if (filterStatus === 'todo' && task.status !== 'todo') return false;
          if (filterStatus === 'in_progress' && task.status !== 'in_progress') return false;
          if (filterStatus === 'active' && task.status === 'completed') return false;
          if (filterStatus === 'completed' && task.status !== 'completed') return false;
        }

        // Need Help Filter
        if (filterNeedHelp && (!task.needHelpFrom || !task.needHelpFrom.name)) {
          return false;
        }

        // Assignee Filter
        if (filterAssignee !== 'all' && task.assignedTo?.name !== filterAssignee) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        let compare = 0;

        if (sortBy === 'priority') {
          compare = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        } else if (sortBy === 'createdAt') {
          compare = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        } else if (sortBy === 'title') {
          compare = (a.title || '').localeCompare(b.title || '');
        } else {
          // Default: dueDate
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          compare = dateA - dateB;
        }

        return sortOrder === 'asc' ? compare : -compare;
      });
  }, [taskTypeTab, normalTasks, recurringTasks, recurringDate, searchQuery, filterPriority, filterStatus, filterNeedHelp, filterAssignee, sortBy, sortOrder]);

  // Combined all assignees from tasks + Assignee Master
  const allAssignees = useMemo(() => {
    const set = new Set();
    assignees.forEach(a => set.add(a.name));
    tasks.forEach((t) => {
      if (t.assignedTo?.name) set.add(t.assignedTo.name);
    });
    return Array.from(set);
  }, [tasks, assignees]);

  // Metrics for Stats Bar: reflects the active tab (Normal vs Recurring on recurringDate)
  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;
    let inProgress = 0;
    let needHelp = 0;
    let dueSoon = 0;

    if (taskTypeTab === 'normal') {
      total = normalTasks.length;
      completed = normalTasks.filter((t) => t.status === 'completed').length;
      inProgress = normalTasks.filter((t) => t.status === 'in_progress').length;
      needHelp = normalTasks.filter((t) => t.needHelpFrom && t.needHelpFrom.name && t.status !== 'completed').length;

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todayTimestamp = new Date(todayStr).getTime();
      dueSoon = normalTasks.filter((t) => {
        if (t.status === 'completed' || !t.dueDate) return false;
        const dueTimestamp = new Date(t.dueDate).getTime();
        return dueTimestamp <= todayTimestamp + 86400000 * 2;
      }).length;
    } else {
      // In Recurring tab: stats on the selected recurringDate
      const scheduledOnDate = recurringTasks.filter((t) => isTaskScheduledOnDate(t, recurringDate));
      total = scheduledOnDate.length;
      completed = scheduledOnDate.filter((t) => Array.isArray(t.completedDates) && t.completedDates.includes(recurringDate)).length;
      inProgress = scheduledOnDate.filter((t) => {
        const isDone = Array.isArray(t.completedDates) && t.completedDates.includes(recurringDate);
        const stepsDone = Array.isArray(t.completedStepsByDate?.[recurringDate]) ? t.completedStepsByDate[recurringDate].length : 0;
        return !isDone && stepsDone > 0;
      }).length;
      needHelp = scheduledOnDate.filter((t) => t.needHelpFrom && t.needHelpFrom.name).length;
    }

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { 
      total, 
      completed, 
      inProgress, 
      needHelp, 
      dueSoon, 
      completionRate,
      normalCount: normalTasks.length,
      recurringCount: recurringTasks.length
    };
  }, [taskTypeTab, normalTasks, recurringTasks, recurringDate]);

  const value = {
    tasks,
    normalTasks,
    recurringTasks,
    taskTypeTab,
    setTaskTypeTab,
    recurringDate,
    setRecurringDate,
    isTaskScheduledOnDate,
    assignees,
    filteredTasks,
    loading,
    stats,
    allAssignees,
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
    filterStatus,
    setFilterStatus,
    filterNeedHelp,
    setFilterNeedHelp,
    filterAssignee,
    setFilterAssignee,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    toggleTaskInProgress,
    toggleTaskStep,
    toggleRecurringDateComplete,
    toggleStopRecurrence,
    addAssignee,
    deleteAssignee
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
