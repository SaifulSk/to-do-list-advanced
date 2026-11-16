import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  Filter, 
  Flame, 
  AlertTriangle, 
  Clock, 
  ArrowUp,
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
    isPriorityFiltered,
    isStatusFiltered,
    resetFilters,
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
  const isFilterActive = isStatusFiltered || filterNeedHelp || isPriorityFiltered;

  const allStatuses = ['todo', 'in_progress', 'completed'];
  const isAllStatusSelected = !filterStatus || filterStatus === 'all' || 
    (Array.isArray(filterStatus) && (filterStatus.includes('all') || allStatuses.every(s => filterStatus.includes(s))));
  
  const isTodoSelected = !isAllStatusSelected && Array.isArray(filterStatus) && filterStatus.includes('todo');
  const isInProgressSelected = !isAllStatusSelected && Array.isArray(filterStatus) && filterStatus.includes('in_progress');
  const isCompletedSelected = !isAllStatusSelected && Array.isArray(filterStatus) && filterStatus.includes('completed');

  const allPriorities = ['urgent', 'high', 'medium', 'low'];
  const isAllPrioritySelected = !filterPriority || filterPriority === 'all' || 
    (Array.isArray(filterPriority) && (filterPriority.includes('all') || allPriorities.every(p => filterPriority.includes(p))));

  const isUrgentSelected = !isAllPrioritySelected && Array.isArray(filterPriority) && filterPriority.includes('urgent');
  const isHighSelected = !isAllPrioritySelected && Array.isArray(filterPriority) && filterPriority.includes('high');
  const isMediumSelected = !isAllPrioritySelected && Array.isArray(filterPriority) && filterPriority.includes('medium');
  const isLowSelected = !isAllPrioritySelected && Array.isArray(filterPriority) && filterPriority.includes('low');

  const handleToggleStatus = (statusKey) => {
    setFilterNeedHelp(false);
    if (isAllStatusSelected) {
      setFilterStatus([statusKey]);
      return;
    }
    const current = Array.isArray(filterStatus) ? filterStatus : [filterStatus];
    let next;
    if (current.includes(statusKey)) {
      next = current.filter((s) => s !== statusKey);
      if (next.length === 0) {
        next = ['all'];
      }
    } else {
      next = [...current, statusKey];
      if (allStatuses.every((s) => next.includes(s))) {
        next = ['all'];
      }
    }
    setFilterStatus(next);
  };

  const handleSelectAllStatus = () => {
    setFilterNeedHelp(false);
    setFilterStatus(['all']);
  };

  const handleTogglePriority = (priorityKey) => {
    if (isAllPrioritySelected) {
      setFilterPriority([priorityKey]);
      return;
    }
    const current = Array.isArray(filterPriority) ? filterPriority : [filterPriority];
    let next;
    if (current.includes(priorityKey)) {
      next = current.filter((p) => p !== priorityKey);
      if (next.length === 0) {
        next = ['all'];
      }
    } else {
      next = [...current, priorityKey];
      if (allPriorities.every((p) => next.includes(p))) {
        next = ['all'];
      }
    }
    setFilterPriority(next);
  };

  const handleSelectAllPriority = () => {
    setFilterPriority(['all']);
  };

  // Labels for current selections
  const getStatusLabel = () => {
    if (filterNeedHelp) {
      if (isAllStatusSelected) return 'Need Help';
      const parts = [];
      if (filterStatus.includes('todo')) parts.push('To Do');
      if (filterStatus.includes('in_progress')) parts.push('In Progress');
      if (filterStatus.includes('completed')) parts.push('Completed');
      return `Need Help (${parts.join(', ')})`;
    }
    if (isAllStatusSelected) return 'All Status';
    const labels = [];
    if (Array.isArray(filterStatus)) {
      if (filterStatus.includes('todo')) labels.push('To Do');
      if (filterStatus.includes('in_progress')) labels.push('In Progress');
      if (filterStatus.includes('completed')) labels.push('Completed');
    }
    if (labels.length === 0) return 'All Status';
    return labels.join(', ');
  };

  const getPriorityLabel = () => {
    if (isAllPrioritySelected) return 'All Priorities';
    const labels = [];
    if (Array.isArray(filterPriority)) {
      if (filterPriority.includes('urgent')) labels.push('Urgent');
      if (filterPriority.includes('high')) labels.push('High');
      if (filterPriority.includes('medium')) labels.push('Medium');
      if (filterPriority.includes('low')) labels.push('Low');
    }
    if (labels.length === 0) return 'All Priorities';
    if (labels.length > 2) return `${labels.length} Priorities`;
    return labels.join(', ');
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'createdAt': return 'Created Date';
      case 'dueDate': return 'Due Date';
      case 'priority': return 'Priority';
      case 'title': return 'Title';
      default: return 'Created Date';
    }
  };

  const handleResetFilters = () => {
    resetFilters();
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
                        className={`filter-sub-item ${isAllStatusSelected && !filterNeedHelp ? 'selected' : ''}`}
                        onClick={handleSelectAllStatus}
                      >
                        <span className="filter-sub-text">All Status</span>
                        {isAllStatusSelected && !filterNeedHelp && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${isTodoSelected && !filterNeedHelp ? 'selected' : ''}`}
                        onClick={() => handleToggleStatus('todo')}
                      >
                        <span className="filter-sub-text">To Do</span>
                        {isTodoSelected && !filterNeedHelp && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${isInProgressSelected && !filterNeedHelp ? 'selected' : ''}`}
                        onClick={() => handleToggleStatus('in_progress')}
                      >
                        <span className="filter-sub-text">In Progress</span>
                        {isInProgressSelected && !filterNeedHelp && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${isCompletedSelected && !filterNeedHelp ? 'selected' : ''}`}
                        onClick={() => handleToggleStatus('completed')}
                      >
                        <span className="filter-sub-text">Completed</span>
                        {isCompletedSelected && !filterNeedHelp && <Check size={14} className="filter-check" />}
                      </button>

                      <div className="filter-submenu-divider" />

                      <button
                        type="button"
                        className={`filter-sub-item ${filterNeedHelp ? 'selected' : ''}`}
                        onClick={() => {
                          setFilterNeedHelp(!filterNeedHelp);
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
                        className={`filter-sub-item ${isAllPrioritySelected ? 'selected' : ''}`}
                        onClick={handleSelectAllPriority}
                      >
                        <span className="filter-sub-text">All Priorities</span>
                        {isAllPrioritySelected && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${isUrgentSelected ? 'selected' : ''}`}
                        onClick={() => handleTogglePriority('urgent')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Flame size={13} color="var(--priority-urgent)" />
                          <span className="filter-sub-text">Urgent</span>
                        </div>
                        {isUrgentSelected && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${isHighSelected ? 'selected' : ''}`}
                        onClick={() => handleTogglePriority('high')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={13} color="var(--priority-high)" />
                          <span className="filter-sub-text">High</span>
                        </div>
                        {isHighSelected && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${isMediumSelected ? 'selected' : ''}`}
                        onClick={() => handleTogglePriority('medium')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={13} color="var(--priority-medium)" />
                          <span className="filter-sub-text">Medium</span>
                        </div>
                        {isMediumSelected && <Check size={14} className="filter-check" />}
                      </button>

                      <button
                        type="button"
                        className={`filter-sub-item ${isLowSelected ? 'selected' : ''}`}
                        onClick={() => handleTogglePriority('low')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ArrowDown size={13} color="var(--priority-low)" />
                          <span className="filter-sub-text">Low</span>
                        </div>
                        {isLowSelected && <Check size={14} className="filter-check" />}
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

        {/* 3. Ascending / Descending Button beside Filter icon (Icon-only) */}
        <button
          type="button"
          className="btn-icon sort-order-btn"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          title={`Order: ${sortOrder === 'asc' ? 'Ascending (Earliest / A-Z first). Click for Descending' : 'Descending (Latest / Z-A first). Click for Ascending'}`}
          aria-label={`Toggle sort order (Current: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`}
        >
          {sortOrder === 'asc' ? (
            <ArrowUp size={17} className="sort-order-icon" />
          ) : (
            <ArrowDown size={17} className="sort-order-icon" />
          )}
        </button>
      </div>
    </div>
  );
};
