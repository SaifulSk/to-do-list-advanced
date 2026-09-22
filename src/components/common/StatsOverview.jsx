import React from 'react';
import { CheckCircle2, Clock, Play } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

export const StatsOverview = () => {
  const { stats, filterStatus, setFilterStatus } = useTasks();

  return (
    <div className="stats-grid">
      {/* Total Tasks */}
      <div 
        className="stat-card" 
        style={{ cursor: 'pointer' }}
        onClick={() => setFilterStatus('all')}
        title="View All Tasks"
      >
        <div className="stat-info">
          <span className="stat-label">Total Tasks</span>
          <span className="stat-val">{stats.total}</span>
        </div>
        <div className="stat-icon-wrap" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
          <CheckCircle2 size={22} />
        </div>
      </div>

      {/* In Progress */}
      <div 
        className="stat-card" 
        style={{ 
          cursor: 'pointer',
          borderColor: filterStatus === 'in_progress' ? '#38bdf8' : 'var(--border-subtle)',
          boxShadow: filterStatus === 'in_progress' ? '0 0 12px rgba(56, 189, 248, 0.2)' : 'none'
        }}
        onClick={() => setFilterStatus(filterStatus === 'in_progress' ? 'all' : 'in_progress')}
        title="Filter In Progress Tasks"
      >
        <div className="stat-info">
          <span className="stat-label">In Progress {filterStatus === 'in_progress' ? '● Active' : ''}</span>
          <span className="stat-val" style={{ color: '#38bdf8' }}>{stats.inProgress}</span>
        </div>
        <div className="stat-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
          <Play size={18} fill="currentColor" />
        </div>
      </div>

      {/* Completed Rate */}
      <div 
        className="stat-card"
        style={{ cursor: 'pointer' }}
        onClick={() => setFilterStatus(filterStatus === 'completed' ? 'all' : 'completed')}
        title="Filter Completed Tasks"
      >
        <div className="stat-info">
          <span className="stat-label">Completion Rate</span>
          <span className="stat-val" style={{ color: 'var(--success)' }}>{stats.completionRate}%</span>
        </div>
        <div className="stat-icon-wrap" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
          <CheckCircle2 size={22} />
        </div>
      </div>

      {/* Due Soon / Overdue */}
      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Due Soon / Overdue</span>
          <span className="stat-val" style={{ color: 'var(--priority-high)' }}>{stats.dueSoon}</span>
        </div>
        <div className="stat-icon-wrap" style={{ background: 'var(--priority-high-bg)', color: 'var(--priority-high)' }}>
          <Clock size={22} />
        </div>
      </div>
    </div>
  );
};
