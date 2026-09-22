import React from 'react';
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
  Check
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

  return (
    <div className="filters-bar">
      {/* Search Input */}
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
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Desktop Filter Pills */}
      <div className="filters-desktop">
        <div className="filter-pills">
          {/* Status Filter */}
          <button
            className={`pill-btn ${filterStatus === 'all' && !filterNeedHelp ? 'active' : ''}`}
            onClick={() => { setFilterStatus('all'); setFilterNeedHelp(false); }}
          >
            All
          </button>
          <button
            className={`pill-btn ${filterStatus === 'todo' && !filterNeedHelp ? 'active' : ''}`}
            onClick={() => { setFilterStatus('todo'); setFilterNeedHelp(false); }}
          >
            To Do
          </button>
          <button
            className={`pill-btn ${filterStatus === 'in_progress' && !filterNeedHelp ? 'active' : ''}`}
            onClick={() => { setFilterStatus('in_progress'); setFilterNeedHelp(false); }}
          >
            <span>In Progress</span>
          </button>
          <button
            className={`pill-btn ${filterStatus === 'completed' && !filterNeedHelp ? 'active' : ''}`}
            onClick={() => { setFilterStatus('completed'); setFilterNeedHelp(false); }}
          >
            <Check size={12} />
            <span>Completed</span>
          </button>

          <div style={{ width: '2px', height: '18px', background: '#000000', margin: '0 4px' }} />

          {/* Priority Filter */}
          <button
            className={`pill-btn ${filterPriority === 'all' ? 'active' : ''}`}
            onClick={() => setFilterPriority('all')}
          >
            All Priorities
          </button>
          <button
            className={`pill-btn ${filterPriority === 'urgent' ? 'active' : ''}`}
            onClick={() => setFilterPriority(filterPriority === 'urgent' ? 'all' : 'urgent')}
            style={filterPriority === 'urgent' ? { background: 'var(--priority-urgent)', color: '#fff' } : {}}
          >
            <Flame size={13} />
            <span>Urgent</span>
          </button>
          <button
            className={`pill-btn ${filterPriority === 'high' ? 'active' : ''}`}
            onClick={() => setFilterPriority(filterPriority === 'high' ? 'all' : 'high')}
            style={filterPriority === 'high' ? { background: 'var(--priority-high)', color: '#fff' } : {}}
          >
            <AlertTriangle size={13} />
            <span>High</span>
          </button>
          <button
            className={`pill-btn ${filterPriority === 'medium' ? 'active' : ''}`}
            onClick={() => setFilterPriority(filterPriority === 'medium' ? 'all' : 'medium')}
            style={filterPriority === 'medium' ? { background: 'var(--priority-medium)', color: '#fff' } : {}}
          >
            <Clock size={13} />
            <span>Medium</span>
          </button>
          <button
            className={`pill-btn ${filterPriority === 'low' ? 'active' : ''}`}
            onClick={() => setFilterPriority(filterPriority === 'low' ? 'all' : 'low')}
          >
            <ArrowDown size={13} />
            <span>Low</span>
          </button>

          <div style={{ width: '2px', height: '18px', background: '#000000', margin: '0 4px' }} />

          {/* Collaboration / Need Help Filter */}
          <button
            className={`pill-btn ${filterNeedHelp ? 'active' : ''}`}
            onClick={() => setFilterNeedHelp(!filterNeedHelp)}
            style={filterNeedHelp ? { background: 'var(--help-accent)', color: '#fff' } : { color: 'var(--help-accent)' }}
          >
            <Users size={13} />
            <span>Need Help</span>
          </button>

          {/* Sort Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <select
              className="select"
              style={{ padding: '6px 12px', fontSize: '0.8125rem', width: 'auto', fontWeight: 700 }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="createdAt">Sort by Created Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="title">Sort by Title</option>
            </select>
            <button
              className="btn-icon"
              style={{ width: '32px', height: '32px' }}
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              <ArrowUpDown size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filter 2-Row Layout */}
      <div className="filters-mobile">
        {/* Row 1: 2 Dropdowns (All Status, All Priorities) */}
        <div className="filter-mobile-row-1">
          <select
            className="select"
            value={filterNeedHelp ? 'need_help' : filterStatus}
            onChange={(e) => {
              if (e.target.value === 'need_help') {
                setFilterNeedHelp(true);
                setFilterStatus('all');
              } else {
                setFilterNeedHelp(false);
                setFilterStatus(e.target.value);
              }
            }}
            style={{ fontWeight: 700, fontSize: '0.8125rem', padding: '8px 12px' }}
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="need_help">Need Help</option>
          </select>

          <select
            className="select"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ fontWeight: 700, fontSize: '0.8125rem', padding: '8px 12px' }}
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Row 2: Sort / Order kept as it is */}
        <div className="filter-mobile-row-2">
          <select
            className="select filter-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ fontWeight: 700, fontSize: '0.8125rem', padding: '8px 12px' }}
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="createdAt">Sort by Created Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="title">Sort by Title</option>
          </select>
          <button
            className="btn-icon"
            style={{ width: '38px', height: '38px', flexShrink: 0 }}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={`Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            <ArrowUpDown size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
