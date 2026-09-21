import React from 'react';
import { CheckCircle2, Clock, Users, Flame } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

export const StatsOverview = () => {
  const { stats, filterNeedHelp, setFilterNeedHelp, filterStatus, setFilterStatus } = useTasks();

  return (
    <div className="stats-grid">
      {/* Total Tasks */}
      <div 
        className="stat-card" 
        style={{ cursor: 'pointer' }}
        onClick={() => { setFilterStatus('all'); setFilterNeedHelp(false); }}
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

      {/* Need Help From Collaborators */}
      <div 
        className="stat-card" 
        style={{ 
          cursor: 'pointer',
          borderColor: filterNeedHelp ? 'var(--help-accent)' : 'var(--border-subtle)',
          boxShadow: filterNeedHelp ? '0 0 12px rgba(168, 85, 247, 0.2)' : 'none'
        }}
        onClick={() => setFilterNeedHelp(!filterNeedHelp)}
        title={filterNeedHelp ? "Clear Need Help Filter" : "Filter Tasks Needing Help"}
      >
        <div className="stat-info">
          <span className="stat-label">
            Need Help {filterNeedHelp ? '● Active' : ''}
          </span>
          <span className="stat-val" style={{ color: 'var(--help-accent)' }}>{stats.needHelp}</span>
        </div>
        <div className="stat-icon-wrap" style={{ background: 'var(--help-accent-bg)', color: 'var(--help-accent)' }}>
          <Users size={22} />
        </div>
      </div>
    </div>
  );
};
