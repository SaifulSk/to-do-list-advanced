import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  Filter, 
  Flame, 
  AlertTriangle, 
  Clock, 
  ArrowDown, 
  Users, 
  ArrowUpDown,
  Check,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Type
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

export const TaskFilters = () => {
  const {
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
    filterStatus,
    setFilterStatus,
    filterNeedHelp,
    setFilterNeedHelp,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
  } = useTasks();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null); // 'status' | 'priority' | 'sort' | null
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
        setActiveSubmenu(null);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Check if any filters are actively applied (non-default)
  const isFilterActive = filterStatus !== 'all' || filterNeedHelp || filterPriority !== 'all';

  // Labels for current selections
  const getStatusLabel = () => {
    if (filterNeedHelp) return 'Need Help';
    switch (filterStatus) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'All Status';
    }
  };

  const getPriorityLabel = () => {
    switch (filterPriority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'All Priorities';
    }
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'dueDate': return 'Due Date';
      case 'createdAt': return 'Created Date';
      case 'priority': return 'Priority';
      case 'title': return 'Title';
      default: return 'Due Date';
    }
  };

  const handleResetFilters = () => {
    setFilterStatus('all');
    setFilterNeedHelp(false);
    setFilterPriority('all');
  };

  return (
    <div className="filters-bar">
      {/* 1. Search Field */}
      <div className="filter-search-wrap">
        <Search size={16} className="filter-search-icon" />
        <input
          type="text"
          className="input filter-search-input"
          placeholder="Search by title, description, assignee, helper, or tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="filter-search-clear-btn"
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 2. Actions: Filter Icon with Submenus + Ascending/Descending Toggle */}
      <div className="filter-actions-wrap" ref={menuRef}>
        {/* Filter Button */}
        <div className="filter-menu-anchor">
          <button
            type="button"
            className={`btn-icon filter-trigger-btn ${isMenuOpen ? 'active' : ''} ${isFilterActive ? 'has-active-filter' : ''}`}
            onClick={() => {
              setIsMenuOpen((prev) => !prev);
              setActiveSubmenu(null);
            }}
            title="Filters & Sorting"
            aria-label="Filter tasks"
            aria-expanded={isMenuOpen}
          >
            <Filter size={17} />
            {isFilterActive && <span className="filter-active-dot" />}
          </button>

          {/* Filter Popover Menu with Submenus */}
          {isMenuOpen && (
            <div className="filter-popover-menu">
              <div className="filter-popover-header">
                <span className="filter-popover-title">Filter & Sort</span>
                {isFilterActive && (
                  <button 
                    type="button"
                    className="filter-reset-link"
                    onClick={handleResetFilters}
                    title="Reset all filters to default"
                  >
                    <RotateCcw size={11} />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              <div className="filter-menu-list">
                {/* --- 1. STATUS MENU & SUBMENU --- */}
                <div 
                  className={`filter-parent-item ${activeSubmenu === 'status' ? 'expanded' : ''}`}
                  onMouseEnter={() => {
                    if (window.innerWidth > 640) setActiveSubmenu('status');
                  }}
                >
                  <button
                    type="button"
                    className="filter-parent-btn"
                    onClick={() => setActiveSubmenu(activeSubmenu === 'status' ? null : 'status')}
                  >
                    <div className="filter-parent-label">
                      <CheckCircle2 size={15} color="var(--primary)" />
                      <span>Status</span>
                    </div>
                    <div className="filter-parent-meta">
                      <span className="filter-selected-tag">{getStatusLabel()}</span>
                      <ChevronRight size={14} className={`filter-chevron ${activeSubmenu === 'status' ? 'rotated' : ''}`} />
                    </div>
                  </button>

                  {/* Status Submenu Items */}
                  {activeSubmenu === 'status' && (
                    <div className="filter-submenu-panel">
                      <button
                        type="button"
                        className={`filter-sub-item ${filterStatus === 'all' && !filterNeedHelp ? 'selected' : ''}`}
                        onClick={() => {
                          setFilterStatus('all');
                          setFilterNeedHelp(false);
                          if (window.innerWidth <= 640) setIsMenuOpen(false);
                        }}
                      >
                        <span className="filter-sub-text">All Status</span>
                        {filterStatus === 'all' && !filterNeedHelp && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${filterStatus === 'todo' && !filterNeedHelp ? 'selected' : ''}`}
                        onClick={() => {
                          setFilterStatus('todo');
                          setFilterNeedHelp(false);
                          if (window.innerWidth <= 640) setIsMenuOpen(false);
                        }}
                      >
                        <span className="filter-sub-text">To Do</span>
                        {filterStatus === 'todo' && !filterNeedHelp && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${filterStatus === 'in_progress' && !filterNeedHelp ? 'selected' : ''}`}
                        onClick={() => {
                          setFilterStatus('in_progress');
                          setFilterNeedHelp(false);
                          if (window.innerWidth <= 640) setIsMenuOpen(false);
                        }}
                      >
                        <span className="filter-sub-text">In Progress</span>
                        {filterStatus === 'in_progress' && !filterNeedHelp && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${filterStatus === 'completed' && !filterNeedHelp ? 'selected' : ''}`}
                        onClick={() => {
                          setFilterStatus('completed');
                          setFilterNeedHelp(false);
                          if (window.innerWidth <= 640) setIsMenuOpen(false);
                        }}
                      >
                        <span className="filter-sub-text">Completed</span>
                        {filterStatus === 'completed' && !filterNeedHelp && <Check size={14} className="filter-check" />}
                      </button>

                      <div className="filter-submenu-divider" />

                      <button
                        type="button"
                        className={`filter-sub-item ${filterNeedHelp ? 'selected' : ''}`}
                        onClick={() => {
                          setFilterNeedHelp(!filterNeedHelp);
                          if (window.innerWidth <= 640) setIsMenuOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={13} color="var(--help-accent)" />
                          <span className="filter-sub-text">Need Help</span>
                        </div>
                        {filterNeedHelp && <Check size={14} className="filter-check" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* --- 2. PRIORITY MENU & SUBMENU --- */}
                <div 
                  className={`filter-parent-item ${activeSubmenu === 'priority' ? 'expanded' : ''}`}
                  onMouseEnter={() => {
                    if (window.innerWidth > 640) setActiveSubmenu('priority');
                  }}
                >
                  <button
                    type="button"
                    className="filter-parent-btn"
                    onClick={() => setActiveSubmenu(activeSubmenu === 'priority' ? null : 'priority')}
                  >
                    <div className="filter-parent-label">
                      <Flame size={15} color="var(--priority-urgent)" />
                      <span>Priority</span>
                    </div>
                    <div className="filter-parent-meta">
                      <span className="filter-selected-tag">{getPriorityLabel()}</span>
                      <ChevronRight size={14} className={`filter-chevron ${activeSubmenu === 'priority' ? 'rotated' : ''}`} />
                    </div>
                  </button>

                  {/* Priority Submenu Items */}
                  {activeSubmenu === 'priority' && (
                    <div className="filter-submenu-panel">
                      <button
                        type="button"
                        className={`filter-sub-item ${filterPriority === 'all' ? 'selected' : ''}`}
                        onClick={() => {
                          setFilterPriority('all');
                          if (window.innerWidth <= 640) setIsMenuOpen(false);
                        }}
                      >
                        <span className="filter-sub-text">All Priorities</span>
                        {filterPriority === 'all' && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${filterPriority === 'urgent' ? 'selected' : ''}`}
                        onClick={() => {
                          setFilterPriority('urgent');
                          if (window.innerWidth <= 640) setIsMenuOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Flame size={13} color="var(--priority-urgent)" />
                          <span className="filter-sub-text">Urgent</span>
                        </div>
                        {filterPriority === 'urgent' && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${filterPriority === 'high' ? 'selected' : ''}`}
                        onClick={() => {
                          setFilterPriority('high');
                          if (window.innerWidth <= 640) setIsMenuOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={13} color="var(--priority-high)" />
                          <span className="filter-sub-text">High</span>
                        </div>
                        {filterPriority === 'high' && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${filterPriority === 'medium' ? 'selected' : ''}`}
                        onClick={() => {
                          setFilterPriority('medium');
                          if (window.innerWidth <= 640) setIsMenuOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={13} color="var(--priority-medium)" />
                          <span className="filter-sub-text">Medium</span>
                        </div>
                        {filterPriority === 'medium' && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${filterPriority === 'low' ? 'selected' : ''}`}
                        onClick={() => {
                          setFilterPriority('low');
                          if (window.innerWidth <= 640) setIsMenuOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ArrowDown size={13} color="var(--priority-low)" />
                          <span className="filter-sub-text">Low</span>
                        </div>
                        {filterPriority === 'low' && <Check size={14} className="filter-check" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* --- 3. SORT BY MENU & SUBMENU --- */}
                <div 
                  className={`filter-parent-item ${activeSubmenu === 'sort' ? 'expanded' : ''}`}
                  onMouseEnter={() => {
                    if (window.innerWidth > 640) setActiveSubmenu('sort');
                  }}
                >
                  <button
                    type="button"
                    className="filter-parent-btn"
                    onClick={() => setActiveSubmenu(activeSubmenu === 'sort' ? null : 'sort')}
                  >
                    <div className="filter-parent-label">
                      <ArrowUpDown size={15} color="var(--primary)" />
                      <span>Sort By</span>
                    </div>
                    <div className="filter-parent-meta">
                      <span className="filter-selected-tag">{getSortLabel()}</span>
                      <ChevronRight size={14} className={`filter-chevron ${activeSubmenu === 'sort' ? 'rotated' : ''}`} />
                    </div>
                  </button>

                  {/* Sort By Submenu Items */}
                  {activeSubmenu === 'sort' && (
                    <div className="filter-submenu-panel">
                      <button
                        type="button"
                        className={`filter-sub-item ${sortBy === 'dueDate' ? 'selected' : ''}`}
                        onClick={() => {
                          setSortBy('dueDate');
                          if (window.innerWidth <= 640) setIsMenuOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} color="var(--text-secondary)" />
                          <span className="filter-sub-text">Due Date</span>
                        </div>
                        {sortBy === 'dueDate' && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${sortBy === 'createdAt' ? 'selected' : ''}`}
                        onClick={() => {
                          setSortBy('createdAt');
                          if (window.innerWidth <= 640) setIsMenuOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={13} color="var(--text-secondary)" />
                          <span className="filter-sub-text">Created Date</span>
                        </div>
                        {sortBy === 'createdAt' && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${sortBy === 'priority' ? 'selected' : ''}`}
                        onClick={() => {
                          setSortBy('priority');
                          if (window.innerWidth <= 640) setIsMenuOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Flame size={13} color="var(--priority-urgent)" />
                          <span className="filter-sub-text">Priority</span>
                        </div>
                        {sortBy === 'priority' && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${sortBy === 'title' ? 'selected' : ''}`}
                        onClick={() => {
                          setSortBy('title');
                          if (window.innerWidth <= 640) setIsMenuOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Type size={13} color="var(--text-secondary)" />
                          <span className="filter-sub-text">Title</span>
                        </div>
                        {sortBy === 'title' && <Check size={14} className="filter-check" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Ascending / Descending Button beside Filter icon */}
        <button
          type="button"
          className="btn-icon sort-order-btn"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          title={`Order: ${sortOrder === 'asc' ? 'Ascending (A-Z / Earliest first)' : 'Descending (Z-A / Latest first)'}`}
          aria-label="Toggle sort order"
        >
          <ArrowUpDown size={16} />
          <span className="sort-order-badge">{sortOrder === 'asc' ? 'ASC' : 'DESC'}</span>
        </button>
      </div>
    </div>
  );
};
