import React from 'react';
import { 
  CheckSquare, 
  List, 
  Table as TableIcon,
  Calendar as CalendarIcon, 
  Plus, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  Users 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ 
  currentView, 
  setCurrentView, 
  theme, 
  toggleTheme, 
  onOpenNewTask, 
  onOpenAuth,
  onOpenAssigneeMaster
}) => {
  const { currentUser, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Top Row for Mobile (Logo on left, View Switcher on right) */}
        <div className="navbar-top-row">
          {/* Brand / Logo */}
          <div className="brand" onClick={() => setCurrentView('list')}>
            <div className="brand-icon">
              <CheckSquare size={18} />
            </div>
            <span>Zenith<span style={{ color: 'var(--primary)', marginLeft: '2px' }}>.</span></span>
          </div>

          {/* View Switcher: List vs Table vs Calendar */}
          <div className="nav-center">
            <div className="view-tabs">
              <button 
                className={`view-tab-btn ${currentView === 'list' ? 'active' : ''}`}
                onClick={() => setCurrentView('list')}
                title="List View"
              >
                <List size={15} />
                <span>List</span>
              </button>
              <button 
                className={`view-tab-btn ${currentView === 'table' ? 'active' : ''}`}
                onClick={() => setCurrentView('table')}
                title="Table View"
              >
                <TableIcon size={15} />
                <span>Table</span>
              </button>
              <button 
                className={`view-tab-btn ${currentView === 'calendar' ? 'active' : ''}`}
                onClick={() => setCurrentView('calendar')}
                title="Calendar View"
              >
                <CalendarIcon size={15} />
                <span>Calendar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Nav Actions */}
        <div className="nav-actions">
          {/* Theme Toggle Button */}
          <button 
            className="btn-icon" 
            onClick={toggleTheme} 
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Team / Assignee Master Directory Button */}
          <button 
            className="btn btn-secondary"
            onClick={onOpenAssigneeMaster}
            title="Open Assignee Master Directory"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Users size={15} />
            <span>Team</span>
          </button>

          {/* New Task Button */}
          <button 
            className="btn btn-primary"
            onClick={onOpenNewTask}
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>

          {/* User Profile / Logout */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                className="avatar" 
                title={currentUser.displayName || currentUser.email}
                style={{ cursor: 'pointer' }}
                onClick={onOpenAuth}
              >
                {currentUser.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <button 
                className="btn-icon" 
                onClick={logout} 
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-secondary"
              onClick={onOpenAuth}
            >
              <User size={15} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
