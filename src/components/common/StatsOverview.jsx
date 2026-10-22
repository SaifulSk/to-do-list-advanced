import React from 'react';
import { CheckCircle2 } from 'lucide-react';
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

      {/* Completion Rate */}
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
    </div>
  );
};
