import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { useAuth } from './AuthContext';
import { 
  isConfigured as isFirebaseLive, 
  subscribeToUserTasks,
  addTaskToFirestore,
  updateTaskInFirestore,
  deleteTaskFromFirestore,
  subscribeToAssignees,
  addAssigneeToFirestore,
  deleteAssigneeFromFirestore
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
const LOCAL_ASSIGNEES_KEY = 'zenith_assignees_master';

export const TaskProvider = ({ children }) => {
  const { currentUser, isFirebaseConnected } = useAuth();

  // Tasks state
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

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_ASSIGNEES_KEY, JSON.stringify(assignees));
    } catch (e) {
      console.warn('Could not persist assignees to localStorage', e);
    }
  }, [assignees]);

  // Real-time Firestore sync for Tasks
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

  // Real-time Firestore sync for Assignees Master
  useEffect(() => {
    if (!isFirebaseConnected) return;

    const unsubscribe = subscribeToAssignees(
      (firestoreAssignees) => {
        if (Array.isArray(firestoreAssignees) && firestoreAssignees.length > 0) {
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
    if (isFirebaseConnected && currentUser) {
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
    if (isFirebaseConnected && currentUser) {
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
    const newTask = {
      ...taskData,
      id: tempId,
      createdAt: taskData.createdAt || format(new Date(), 'yyyy-MM-dd'),
      status: 'todo', // Creation status is always 'todo' by default
      userId: currentUser ? currentUser.uid : 'user-local'
    };

    // Instantly update local state
    setTasks((prev) => [newTask, ...prev.filter(t => t.id !== tempId)]);

    // Persist to Firestore
    if (isFirebaseConnected && currentUser) {
      try {
        const { id, ...cleanData } = newTask;
        const docRef = await addTaskToFirestore(cleanData);
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
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));

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

  // Toggle In-Progress status for a task
  const toggleTaskInProgress = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Toggle between in_progress and todo
    const newStatus = task.status === 'in_progress' ? 'todo' : 'in_progress';
    await updateTask(taskId, { status: newStatus });
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
        if (filterStatus === 'todo' && task.status !== 'todo') {
          return false;
        }
        if (filterStatus === 'in_progress' && task.status !== 'in_progress') {
          return false;
        }
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

  // Combined all assignees from tasks + Assignee Master
  const allAssignees = useMemo(() => {
    const set = new Set();
    assignees.forEach(a => set.add(a.name));
    tasks.forEach((t) => {
      if (t.assignedTo?.name) set.add(t.assignedTo.name);
    });
    return Array.from(set);
  }, [tasks, assignees]);

  // Metrics for Stats Bar
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const needHelp = tasks.filter((t) => t.needHelpFrom && t.needHelpFrom.name && t.status !== 'completed').length;
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayTimestamp = new Date(todayStr).getTime();
    const dueSoon = tasks.filter((t) => {
      if (t.status === 'completed' || !t.dueDate) return false;
      const dueTimestamp = new Date(t.dueDate).getTime();
      return dueTimestamp <= todayTimestamp + 86400000 * 2;
    }).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, needHelp, dueSoon, completionRate };
  }, [tasks]);

  const value = {
    tasks,
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
    addAssignee,
    deleteAssignee
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
