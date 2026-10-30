import React, { useState, useEffect } from 'react';
import { CheckSquare, Repeat, Star } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { Navbar } from './components/common/Navbar';
import { TaskFilters } from './components/tasks/TaskFilters';
import { TaskListView } from './components/tasks/TaskListView';
import { TaskTableView } from './components/tasks/TaskTableView';
import { CalendarView } from './components/calendar/CalendarView';
import { RecurringDatePicker } from './components/tasks/RecurringDatePicker';
import { RecurringTasksView } from './components/tasks/RecurringTasksView';
import { TaskFormModal } from './components/tasks/TaskFormModal';
import { AssigneeMasterModal } from './components/assignees/AssigneeMasterModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthPage } from './components/auth/AuthPage';

function MainLayout() {
  const { currentUser, loading } = useAuth();
  const { theme, toggleTheme, defaultView } = useTheme();
  const { 
    taskTypeTab, 
    setTaskTypeTab, 
    normalTasks, 
    recurringTasks,
    defaultTaskType,
    setAccountDefaultTaskType
  } = useTasks();

  const [currentView, setCurrentView] = useState(() => {
    const userKey = currentUser?.uid ? `zenith_default_view_${currentUser.uid}` : 'zenith_default_view';
    return localStorage.getItem(userKey) || localStorage.getItem('zenith_default_view') || 'list';
  });

  const [hasManuallyChangedView, setHasManuallyChangedView] = useState(false);

  // When defaultView loads from storage or remote sync, apply if view wasn't manually altered
  useEffect(() => {
    if (!hasManuallyChangedView && defaultView) {
      setCurrentView(defaultView);
    }
  }, [defaultView, hasManuallyChangedView]);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleOpenNewTask = (date = null) => {
    setEditingTask(null);
    setDefaultDate(typeof date === 'string' ? date : null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setDefaultDate(null);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setDefaultDate(null);
  };

  // 1. Loading State
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', color: 'var(--text-muted)' }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Loading workspace...</p>
      </div>
    );
  }

  // 2. Open Login Page First if user is not authenticated
  if (!currentUser) {
    return <AuthPage theme={theme} toggleTheme={toggleTheme} />;
  }

  // 3. Authenticated Workspace
  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          setHasManuallyChangedView(true);
          setCurrentView(view);
        }}
        defaultView={defaultView}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenNewTask={() => handleOpenNewTask()}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAssigneeMaster={() => setIsAssigneeModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <main className="main-content">
        {/* Fixed Top Controls Header (Tabs, Date Picker & Search/Filters) */}
        <div className="workspace-fixed-header">
          {/* Task Segmentation Header Bar: Normal vs Recurring Tabs + Extreme-Right Date Picker */}
          <div className="task-type-header-bar">
            <div className="task-type-tabs">
              <button 
                type="button"
                className={`task-type-tab ${taskTypeTab === 'normal' ? 'active' : ''}`}
                onClick={() => setTaskTypeTab('normal')}
                title="Normal Tasks"
              >
                <CheckSquare size={15} />
                <span className="task-type-label-desktop">Normal Tasks</span>
                <span className="task-type-label-mobile">Normal</span>
                <span className="task-type-badge">{normalTasks.length}</span>
                <span
                  role="button"
                  tabIndex={0}
                  className={`tab-default-star-btn ${defaultTaskType === 'normal' ? 'is-default' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAccountDefaultTaskType('normal');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setAccountDefaultTaskType('normal');
                    }
                  }}
                  title={defaultTaskType === 'normal' ? "Default tab (opens on start)" : "Click to set Normal Tasks as default"}
                  aria-label={defaultTaskType === 'normal' ? "Default tab" : "Set Normal Tasks as default"}
                >
                  <Star size={13} fill={defaultTaskType === 'normal' ? 'currentColor' : 'none'} />
                </span>
              </button>

              <button 
                type="button"
                className={`task-type-tab ${taskTypeTab === 'recurring' ? 'active' : ''}`}
                onClick={() => setTaskTypeTab('recurring')}
                title="Recurring Tasks"
              >
                <Repeat size={15} />
                <span className="task-type-label-desktop">Recurring Tasks</span>
                <span className="task-type-label-mobile">Recurring</span>
                <span className="task-type-badge">{recurringTasks.length}</span>
                <span
                  role="button"
                  tabIndex={0}
                  className={`tab-default-star-btn ${defaultTaskType === 'recurring' ? 'is-default' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAccountDefaultTaskType('recurring');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setAccountDefaultTaskType('recurring');
                    }
                  }}
                  title={defaultTaskType === 'recurring' ? "Default tab (opens on start)" : "Click to set Recurring Tasks as default"}
                  aria-label={defaultTaskType === 'recurring' ? "Default tab" : "Set Recurring Tasks as default"}
                >
                  <Star size={13} fill={defaultTaskType === 'recurring' ? 'currentColor' : 'none'} />
                </span>
              </button>
            </div>

            {/* Extreme-Right on Desktop, Center-Aligned on Mobile */}
            {taskTypeTab === 'recurring' && (
              <div className="recurring-date-picker-container">
                <RecurringDatePicker />
              </div>
            )}
          </div>

          {/* Search field & Filter icon with cascading submenus (for List and Table views) */}
          {currentView !== 'calendar' && <TaskFilters />}
        </div>

        {/* Scrollable View Area (Only list/table items scroll) */}
        <div className={`workspace-scrollable-body view-${currentView}`}>
          {currentView === 'list' ? (
            <TaskListView 
              onEditTask={handleEditTask} 
              onOpenNewTask={() => handleOpenNewTask()} 
            />
          ) : currentView === 'table' ? (
            <TaskTableView 
              onEditTask={handleEditTask} 
              onOpenNewTask={() => handleOpenNewTask()} 
            />
          ) : (
            <CalendarView 
              onOpenNewTask={handleOpenNewTask} 
              onEditTask={handleEditTask} 
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        initialTask={editingTask}
        defaultDate={defaultDate}
        onOpenAssigneeMaster={() => setIsAssigneeModalOpen(true)}
      />

      <AssigneeMasterModal
        isOpen={isAssigneeModalOpen}
        onClose={() => setIsAssigneeModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentView={currentView}
        onSelectView={(view) => {
          setHasManuallyChangedView(true);
          setCurrentView(view);
        }}
      />
      {/* Auth Modal */}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <TaskProvider>
          <MainLayout />
        </TaskProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
