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
import { NotificationBell } from './NotificationBell';

export const Navbar = ({ 
  currentView, 
  setCurrentView, 
  defaultView = 'list',
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
          <div className="brand" onClick={() => setCurrentView(defaultView || 'list')}>
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
                title={defaultView === 'list' ? "List View (Default)" : "List View"}
              >
                <List size={15} />
                <span>List</span>
                {defaultView === 'list' && <span className="tab-default-dot" title="Default View" />}
              </button>
              <button 
                className={`view-tab-btn ${currentView === 'table' ? 'active' : ''}`}
                onClick={() => setCurrentView('table')}
                title={defaultView === 'table' ? "Table View (Default)" : "Table View"}
              >
                <TableIcon size={15} />
                <span>Table</span>
                {defaultView === 'table' && <span className="tab-default-dot" title="Default View" />}
              </button>
              <button 
                className={`view-tab-btn ${currentView === 'calendar' ? 'active' : ''}`}
                onClick={() => setCurrentView('calendar')}
                title={defaultView === 'calendar' ? "Calendar View (Default)" : "Calendar View"}
              >
                <CalendarIcon size={15} />
                <span>Calendar</span>
                {defaultView === 'calendar' && <span className="tab-default-dot" title="Default View" />}
              </button>
            </div>
          </div>
        </div>

        {/* Nav Actions */}
        <div className="nav-actions">
          {/* Notification Center Bell */}
          <NotificationBell />

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
