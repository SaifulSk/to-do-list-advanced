import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { format, addDays, subDays } from 'date-fns';
import { useAuth } from './AuthContext';
import { 
  db, 
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

const LOCAL_TASKS_KEY = 'zenith_tasks_data';

// Helper to get formatted relative dates for sample tasks
const todayStr = format(new Date(), 'yyyy-MM-dd');
const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
const inThreeDaysStr = format(addDays(new Date(), 3), 'yyyy-MM-dd');
const inFiveDaysStr = format(addDays(new Date(), 5), 'yyyy-MM-dd');
const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
const threeDaysAgoStr = format(subDays(new Date(), 3), 'yyyy-MM-dd');

// Default initial tasks highlighting all capabilities
const INITIAL_DEMO_TASKS = [
  {
    id: 'task-1',
    title: 'Migrate PostgreSQL Database Indexes to Production',
    description: 'Optimize high-traffic query indexes and review replica latency before the v2.4 launch.',
    priority: 'urgent',
    status: 'in_progress',
    createdAt: threeDaysAgoStr,
    dueDate: tomorrowStr,
    assignedTo: {
      name: 'Alex Morgan',
      email: 'alex.morgan@zenith.design',
      avatar: 'AM'
    },
    needHelpFrom: {
      name: 'Elena Rostova',
      email: 'elena.rostova@zenith.design',
      topic: 'Query Plan & Index Locking Review'
    },
    tags: ['Database', 'DevOps', 'Urgent'],
    userId: 'demo-user-123'
  },
  {
    id: 'task-2',
    title: 'Design Minimalist Dark Mode Token Architecture',
    description: 'Audit HSL color contrasts, interactive states, and glassmorphic elevations across components.',
    priority: 'high',
    status: 'todo',
    createdAt: yesterdayStr,
    dueDate: inThreeDaysStr,
    assignedTo: {
      name: 'Sarah Chen',
      email: 'sarah.c@zenith.design',
      avatar: 'SC'
    },
    needHelpFrom: {
      name: 'Marcus Bell',
      email: 'marcus.b@zenith.design',
      topic: 'Accessibility (WCAG AAA) validation'
    },
    tags: ['Design', 'Tokens', 'UI/UX'],
    userId: 'demo-user-123'
  },
  {
    id: 'task-3',
    title: 'Implement Multi-Perspective Calendar Synchronization',
    description: 'Render creation timelines and due dates side-by-side with color-coded day cell badges.',
    priority: 'medium',
    status: 'in_progress',
    createdAt: todayStr,
    dueDate: inFiveDaysStr,
    assignedTo: {
      name: 'Alex Morgan',
      email: 'alex.morgan@zenith.design',
      avatar: 'AM'
    },
    needHelpFrom: null,
    tags: ['Frontend', 'Calendar', 'React'],
    userId: 'demo-user-123'
  },
  {
    id: 'task-4',
    title: 'Audit Firebase Security Rules & Token Expirations',
    description: 'Ensure document read/write authorization restricts access strictly to verified user UID matches.',
    priority: 'high',
    status: 'todo',
    createdAt: yesterdayStr,
    dueDate: todayStr,
    assignedTo: {
      name: 'Liam Vance',
      email: 'liam.v@zenith.design',
      avatar: 'LV'
    },
    needHelpFrom: {
      name: 'DevSecOps Team',
      email: 'security@zenith.design',
      topic: 'Automated penetration testing suite'
    },
    tags: ['Security', 'Firebase'],
    userId: 'demo-user-123'
  },
  {
    id: 'task-5',
    title: 'Setup Automated CI/CD Pipeline for Vite Build',
    description: 'Configure GitHub Actions for automated typechecking, linting, and staging deployment.',
    priority: 'low',
    status: 'completed',
    createdAt: threeDaysAgoStr,
    dueDate: yesterdayStr,
    assignedTo: {
      name: 'Marcus Bell',
      email: 'marcus.b@zenith.design',
      avatar: 'MB'
    },
    needHelpFrom: null,
    tags: ['Infra', 'CI/CD'],
    userId: 'demo-user-123'
  }
];

export const TaskProvider = ({ children }) => {
  const { currentUser, isFirebaseConnected } = useAuth();

  // Tasks local state
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_TASKS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading saved tasks:', e);
    }
    return INITIAL_DEMO_TASKS;
  });

  const [loading, setLoading] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all'); // all, urgent, high, medium, low
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, completed
  const [filterNeedHelp, setFilterNeedHelp] = useState(false); // boolean
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate'); // dueDate, createdAt, priority
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // Sync to localStorage when tasks change in local/demo mode
  useEffect(() => {
    if (!isFirebaseConnected || currentUser?.isDemo) {
      try {
        localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
      } catch (e) {
        console.warn('Could not persist tasks to localStorage', e);
      }
    }
  }, [tasks, isFirebaseConnected, currentUser]);

  // Real-time Firestore sync when live Firebase user is authenticated
  useEffect(() => {
    if (!isFirebaseConnected || !currentUser || currentUser.isDemo) {
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserTasks(
      currentUser.uid,
      (firestoreTasks) => {
        setTasks(firestoreTasks);
        setLoading(false);
      },
      (error) => {
        console.warn('Firestore fallback: loading local tasks', error);
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isFirebaseConnected, currentUser]);

  // Create Task
  const addTask = async (taskData) => {
    const newTask = {
      ...taskData,
      id: 'task-' + Date.now(),
      createdAt: taskData.createdAt || format(new Date(), 'yyyy-MM-dd'),
      status: taskData.status || 'todo',
      userId: currentUser ? currentUser.uid : 'demo-user-123'
    };

    if (isFirebaseConnected && currentUser && !currentUser.isDemo) {
      try {
        await addTaskToFirestore(newTask);
      } catch (err) {
        console.error('Failed to add task to Firestore, adding locally:', err);
        setTasks((prev) => [newTask, ...prev]);
      }
    } else {
      setTasks((prev) => [newTask, ...prev]);
    }

    return newTask;
  };

  // Update Task
  const updateTask = async (taskId, updates) => {
    if (isFirebaseConnected && currentUser && !currentUser.isDemo) {
      try {
        await updateTaskInFirestore(taskId, updates);
      } catch (err) {
        console.error('Failed to update in Firestore, updating locally:', err);
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
      }
    } else {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    }
  };

  // Delete Task
  const deleteTask = async (taskId) => {
    if (isFirebaseConnected && currentUser && !currentUser.isDemo) {
      try {
        await deleteTaskFromFirestore(taskId);
      } catch (err) {
        console.error('Failed to delete in Firestore, deleting locally:', err);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  // Toggle Task Completion (with celebration confetti)
  const toggleTaskComplete = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const isNowCompleted = task.status !== 'completed';
    const newStatus = isNowCompleted ? 'completed' : 'todo';

    if (isNowCompleted) {
      // Fire confetti animation
      try {
        confetti({
          particleCount: 65,
          spread: 55,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#10b981', '#a855f7', '#38bdf8']
        });
      } catch (e) {
        // ignore confetti errors
      }
    }

    await updateTask(taskId, { status: newStatus });
  };

  // Reset sample tasks (useful for testing)
  const resetDemoTasks = () => {
    setTasks(INITIAL_DEMO_TASKS);
    localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(INITIAL_DEMO_TASKS));
  };

  // Filtered and Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
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
          compare = a.title.localeCompare(b.title);
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
    
    // Count overdue or due today
    const todayTimestamp = new Date(todayStr).getTime();
    const dueSoon = tasks.filter((t) => {
      if (t.status === 'completed' || !t.dueDate) return false;
      const dueTimestamp = new Date(t.dueDate).getTime();
      return dueTimestamp <= todayTimestamp + 86400000 * 2; // due within 48 hrs or overdue
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
    toggleTaskComplete,
    resetDemoTasks
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
