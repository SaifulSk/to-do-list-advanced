import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { Navbar } from './components/common/Navbar';
import { StatsOverview } from './components/common/StatsOverview';
import { TaskFilters } from './components/tasks/TaskFilters';
import { TaskListView } from './components/tasks/TaskListView';
import { CalendarView } from './components/calendar/CalendarView';
import { TaskFormModal } from './components/tasks/TaskFormModal';
import { AuthModal } from './components/auth/AuthModal';
import { FirebaseConfigModal } from './components/common/FirebaseConfigModal';

function MainLayout() {
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'calendar'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('zenith_theme') || 'dark';
  });

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  // Sync theme with document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('zenith_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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
        onOpenFirebaseConfig={() => setIsFirebaseModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <main className="main-content">
        {/* Dynamic Minimalist Stats Header */}
        <StatsOverview />

        {/* View Switcher: List vs Calendar */}
        {currentView === 'list' ? (
          <>
            <TaskFilters />
            <TaskListView 
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
        onClose={() => setIsTaskModalOpen(false)}
        initialTask={editingTask}
        defaultDate={defaultDate}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <MainLayout />
      </TaskProvider>
    </AuthProvider>
  );
}
