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

      {/* Filter Pills */}
      <div className="filter-pills">
        {/* Status Filter */}
        <button
          className={`pill-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All
        </button>
        <button
          className={`pill-btn ${filterStatus === 'active' ? 'active' : ''}`}
          onClick={() => setFilterStatus('active')}
        >
          Active
        </button>
        <button
          className={`pill-btn ${filterStatus === 'completed' ? 'active' : ''}`}
          onClick={() => setFilterStatus('completed')}
        >
          <Check size={12} />
          <span>Completed</span>
        </button>

        <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* Priority Filter */}
        <button
          className={`pill-btn ${filterPriority === 'all' && !filterNeedHelp ? 'active' : ''}`}
          onClick={() => { setFilterPriority('all'); }}
        >
          All Priorities
        </button>
        <button
          className={`pill-btn ${filterPriority === 'urgent' ? 'active' : ''}`}
          onClick={() => setFilterPriority(filterPriority === 'urgent' ? 'all' : 'urgent')}
          style={filterPriority === 'urgent' ? { background: 'var(--priority-urgent)', borderColor: 'var(--priority-urgent)' } : {}}
        >
          <Flame size={13} color="var(--priority-urgent)" />
          <span>Urgent</span>
        </button>
        <button
          className={`pill-btn ${filterPriority === 'high' ? 'active' : ''}`}
          onClick={() => setFilterPriority(filterPriority === 'high' ? 'all' : 'high')}
          style={filterPriority === 'high' ? { background: 'var(--priority-high)', borderColor: 'var(--priority-high)' } : {}}
        >
          <AlertTriangle size={13} color="var(--priority-high)" />
          <span>High</span>
        </button>
        <button
          className={`pill-btn ${filterPriority === 'medium' ? 'active' : ''}`}
          onClick={() => setFilterPriority(filterPriority === 'medium' ? 'all' : 'medium')}
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

        <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* Collaboration / Need Help Filter */}
        <button
          className={`pill-btn ${filterNeedHelp ? 'active' : ''}`}
          onClick={() => setFilterNeedHelp(!filterNeedHelp)}
          style={filterNeedHelp ? { background: 'var(--help-accent)', borderColor: 'var(--help-accent)', color: '#fff' } : { color: 'var(--help-accent)' }}
        >
          <Users size={13} />
          <span>Need Help</span>
        </button>

        {/* Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
          <select
            className="select"
            style={{ padding: '4px 10px', fontSize: '0.75rem', width: 'auto' }}
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
            style={{ width: '28px', height: '28px' }}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={`Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            <ArrowUpDown size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
