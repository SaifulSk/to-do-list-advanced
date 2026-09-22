import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { TaskProvider } from './context/TaskContext';
import { Navbar } from './components/common/Navbar';
import { StatsOverview } from './components/common/StatsOverview';
import { TaskFilters } from './components/tasks/TaskFilters';
import { TaskListView } from './components/tasks/TaskListView';
import { TaskTableView } from './components/tasks/TaskTableView';
import { CalendarView } from './components/calendar/CalendarView';
import { TaskFormModal } from './components/tasks/TaskFormModal';
import { AssigneeMasterModal } from './components/assignees/AssigneeMasterModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthPage } from './components/auth/AuthPage';

function MainLayout() {
  const { currentUser, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [currentView, setCurrentView] = useState('list'); // 'list' | 'calendar'

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
        setCurrentView={setCurrentView}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenNewTask={() => handleOpenNewTask()}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAssigneeMaster={() => setIsAssigneeModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <main className="main-content">
        {/* Dynamic Minimalist Stats Header */}
        <StatsOverview />

        {/* View Switcher: List vs Table vs Calendar */}
        {currentView === 'list' ? (
          <>
            <TaskFilters />
            <TaskListView 
              onEditTask={handleEditTask} 
              onOpenNewTask={() => handleOpenNewTask()} 
            />
          </>
        ) : currentView === 'table' ? (
          <>
            <TaskFilters />
            <TaskTableView 
              onEditTask={handleEditTask} 
              onOpenNewTask={() => handleOpenNewTask()} 
            />
          </>
        ) : (
          <CalendarView 
            onOpenNewTask={handleOpenNewTask} 
            onEditTask={handleEditTask} 
          />
        )}
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
      />
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
