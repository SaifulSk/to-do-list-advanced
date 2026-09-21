import React from 'react';
import { CheckSquare, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { TaskCard } from './TaskCard';

export const TaskListView = ({ onEditTask, onOpenNewTask }) => {
  const { 
    filteredTasks, 
    tasks, 
    searchQuery, 
    filterPriority, 
    filterStatus, 
    filterNeedHelp, 
    setSearchQuery, 
    setFilterPriority, 
    setFilterStatus, 
    setFilterNeedHelp,
    resetDemoTasks 
  } = useTasks();

  const isFiltering = searchQuery || filterPriority !== 'all' || filterStatus !== 'all' || filterNeedHelp;

  if (tasks.length === 0) {
    return (
      <div className="empty-state glass-panel">
        <div className="empty-state-icon">
          <CheckSquare size={32} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>No tasks found</h3>
          <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>Get started by creating your first task or reload sample tasks.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button className="btn btn-primary" onClick={onOpenNewTask}>
            <Plus size={16} />
            <span>Create Task</span>
          </button>
          <button className="btn btn-secondary" onClick={resetDemoTasks}>
            <RefreshCw size={15} />
            <span>Load Demo Tasks</span>
          </button>
        </div>
      </div>
    );
  }

  if (filteredTasks.length === 0 && isFiltering) {
    return (
      <div className="empty-state glass-panel">
        <div className="empty-state-icon">
          <AlertCircle size={32} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>No matching tasks</h3>
          <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>Try adjusting your search query, priority, or filters.</p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={() => {
            setSearchQuery('');
            setFilterPriority('all');
            setFilterStatus('all');
            setFilterNeedHelp(false);
          }}
        >
          <span>Reset All Filters</span>
        </button>
      </div>
    );
  }

  return (
    <div className="task-list">
      {filteredTasks.map((task) => (
        <TaskCard key={task.id} task={task} onEdit={onEditTask} />
      ))}
    </div>
  );
};
