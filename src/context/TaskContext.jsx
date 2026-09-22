import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { useAuth } from './AuthContext';
import { 
  isConfigured as isFirebaseLive, 
  subscribeToUserTasks,
  addTaskToFirestore,
  updateTaskInFirestore,
  deleteTaskFromFirestore
} from '../services/firebase';

const TaskContext = createContext(null);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

const LOCAL_TASKS_KEY = 'zenith_user_tasks';

export const TaskProvider = ({ children }) => {
  const { currentUser, isFirebaseConnected } = useAuth();

  // Tasks state initialized to empty array (no demo tasks)
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_TASKS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading saved tasks:', e);
    }
    return [];
  });

  const [loading, setLoading] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all'); // all, urgent, high, medium, low
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, completed
  const [filterNeedHelp, setFilterNeedHelp] = useState(false); // boolean
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate'); // dueDate, createdAt, priority, title
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // Sync to local storage for backup
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Could not persist tasks to localStorage', e);
    }
  }, [tasks]);

  // Real-time Firestore sync when user is authenticated
  useEffect(() => {
    if (!isFirebaseConnected || !currentUser) {
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserTasks(
      currentUser.uid,
      (firestoreTasks) => {
        if (Array.isArray(firestoreTasks) && firestoreTasks.length > 0) {
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
  }, [isFirebaseConnected, currentUser]);

  // Create Task (Optimistic UI)
  const addTask = async (taskData) => {
    const tempId = 'task-' + Date.now();
    const newTask = {
      ...taskData,
      id: tempId,
      createdAt: taskData.createdAt || format(new Date(), 'yyyy-MM-dd'),
      status: taskData.status || 'todo',
      userId: currentUser ? currentUser.uid : 'user-local'
    };

    // 1. Instantly update local state
    setTasks((prev) => [newTask, ...prev.filter(t => t.id !== tempId)]);

    // 2. Persist to Firestore
    if (isFirebaseConnected && currentUser) {
      try {
        const { id, ...cleanData } = newTask;
        const docRef = await addTaskToFirestore(cleanData);
        // Replace temp ID with Firestore document ID
        setTasks((prev) => prev.map(t => t.id === tempId ? { ...t, id: docRef.id } : t));
        newTask.id = docRef.id;
      } catch (err) {
        console.error('Firestore write error, keeping local task:', err);
      }
    }

    return newTask;
  };

  // Update Task (Optimistic UI)
  const updateTask = async (taskId, updates) => {
    // 1. Instantly update local state
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));

    // 2. Persist to Firestore
    if (isFirebaseConnected && currentUser) {
      try {
        await updateTaskInFirestore(taskId, updates);
      } catch (err) {
        console.error('Firestore update error, keeping local changes:', err);
      }
    }
  };

  // Delete Task (Optimistic UI)
  const deleteTask = async (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (isFirebaseConnected && currentUser) {
      try {
        await deleteTaskFromFirestore(taskId);
      } catch (err) {
        console.error('Firestore delete error:', err);
      }
    }
  };

  // Toggle Task Completion (with celebratory confetti)
  const toggleTaskComplete = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const isNowCompleted = task.status !== 'completed';
    const newStatus = isNowCompleted ? 'completed' : 'todo';

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
    }

    await updateTask(taskId, { status: newStatus });
  };

  // Filtered and Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks
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
        if (filterStatus === 'active' && task.status === 'completed') {
          return false;
        }
        if (filterStatus === 'completed' && task.status !== 'completed') {
          return false;
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
  }, [tasks, searchQuery, filterPriority, filterStatus, filterNeedHelp, filterAssignee, sortBy, sortOrder]);

  // Distinct assignees list for filters dropdown
  const allAssignees = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => {
      if (t.assignedTo?.name) set.add(t.assignedTo.name);
    });
    return Array.from(set);
  }, [tasks]);

  // Metrics for Stats Bar
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const needHelp = tasks.filter((t) => t.needHelpFrom && t.needHelpFrom.name && t.status !== 'completed').length;
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayTimestamp = new Date(todayStr).getTime();
    const dueSoon = tasks.filter((t) => {
      if (t.status === 'completed' || !t.dueDate) return false;
      const dueTimestamp = new Date(t.dueDate).getTime();
      return dueTimestamp <= todayTimestamp + 86400000 * 2;
    }).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, needHelp, dueSoon, completionRate };
  }, [tasks]);

  const value = {
    tasks,
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
    toggleTaskComplete
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
