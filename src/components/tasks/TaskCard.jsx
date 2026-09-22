import React, { useState } from 'react';
import { 
  Check, 
  Calendar, 
  Clock, 
  Flame, 
  AlertTriangle, 
  ArrowDown, 
  Users, 
  MoreVertical, 
  Trash2, 
  Edit3,
  HelpCircle,
  Play,
  X
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import { useTasks } from '../../context/TaskContext';

export const TaskCard = ({ task, onEdit }) => {
  const { toggleTaskComplete, deleteTask, toggleTaskInProgress } = useTasks();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';

  // Format Due Date helper
  const getDueDateDisplay = (dateString) => {
    if (!dateString) return null;
    try {
      const parsed = parseISO(dateString);
      if (isNaN(parsed.getTime())) return dateString;

      if (isToday(parsed)) return { text: 'Due Today', class: 'today' };
      if (isTomorrow(parsed)) return { text: 'Due Tomorrow', class: 'tomorrow' };
      if (isPast(parsed) && !isCompleted) return { text: `Overdue (${format(parsed, 'MMM d')})`, class: 'overdue' };

      return { text: `Due ${format(parsed, 'MMM d')}`, class: 'normal' };
    } catch (e) {
      return { text: `Due ${dateString}`, class: 'normal' };
    }
  };

  // Format Created Date helper
  const getCreatedDateDisplay = (dateString) => {
    if (!dateString) return null;
    try {
      const parsed = parseISO(dateString);
      if (isNaN(parsed.getTime())) return dateString;
      return format(parsed, 'MMM d');
    } catch (e) {
      return dateString;
    }
  };

  const dueInfo = getDueDateDisplay(task.dueDate);
  const createdDate = getCreatedDateDisplay(task.createdAt);

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <Flame size={12} />;
      case 'high': return <AlertTriangle size={12} />;
      case 'medium': return <Clock size={12} />;
      case 'low': return <ArrowDown size={12} />;
      default: return null;
    }
  };

  return (
    <div className={`task-card priority-${task.priority} ${isCompleted ? 'completed' : ''} ${isInProgress ? 'in-progress' : ''}`}>
      {/* Checkbox */}
      <div 
        className={`custom-checkbox ${isCompleted ? 'checked' : ''}`}
        onClick={() => toggleTaskComplete(task.id)}
        title={isCompleted ? "Mark as Incomplete" : "Mark as Completed"}
      >
        {isCompleted && <Check size={14} />}
      </div>

      {/* Task Content */}
      <div className="task-content">
        <div className="task-header">
          <h3 className="task-title">{task.title}</h3>
          
          {/* Actions */}
          <div className="task-actions">
            {!isCompleted && (
              <button 
                type="button"
                className={`status-toggle-btn ${isInProgress ? 'in-progress' : 'todo'}`}
                onClick={() => toggleTaskInProgress(task.id)}
                title={isInProgress ? "Task is in progress. Click to revert to To Do" : "Click to mark as In Progress"}
              >
                {isInProgress ? (
                  <>
                    <span className="status-dot-pulse" />
                    <span>In Progress</span>
                  </>
                ) : (
                  <>
                    <Play size={11} fill="currentColor" />
                    <span>In Progress</span>
                  </>
                )}
              </button>
            )}

            <button 
              className="btn-icon" 
              style={{ width: '28px', height: '28px' }} 
              onClick={() => onEdit(task)}
              title="Edit Task"
            >
              <Edit3 size={13} />
            </button>
            <button 
              className="btn-icon" 
              style={{ width: '28px', height: '28px', color: 'var(--priority-urgent)' }} 
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete Task"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Task Description */}
        {task.description && (
          <p className="task-desc">{task.description}</p>
        )}

        {/* Metadata Row: Status, Priority, Due Date, Created Date, Assigned To, Need Help From */}
        <div className="task-metadata">
          {/* Status Badge */}
          {isCompleted ? (
            <span className="badge badge-completed">
              <Check size={11} />
              <span>Done</span>
            </span>
          ) : isInProgress ? (
            <span 
              className="badge badge-in-progress"
              onClick={() => toggleTaskInProgress(task.id)}
              style={{ cursor: 'pointer' }}
              title="In Progress. Click to set back to To Do"
            >
              <span className="status-dot-pulse" />
              <span>In Progress</span>
            </span>
          ) : (
            <span 
              className="badge badge-todo"
              onClick={() => toggleTaskInProgress(task.id)}
              style={{ cursor: 'pointer' }}
              title="To Do. Click to set to In Progress"
            >
              <span>To Do</span>
            </span>
          )}

          {/* Priority Pill */}
          <span className={`badge badge-${task.priority}`}>
            {getPriorityIcon(task.priority)}
            <span style={{ textTransform: 'capitalize' }}>{task.priority}</span>
          </span>

          {/* Due Date Badge */}
          {dueInfo && (
            <span className={`badge badge-date ${dueInfo.class}`}>
              <Calendar size={12} />
              <span>{dueInfo.text}</span>
            </span>
          )}

          {/* Created Date Badge */}
          {createdDate && (
            <span className="badge badge-date" title={`Created on ${task.createdAt}`} style={{ opacity: 0.8 }}>
              <Clock size={12} />
              <span>Created {createdDate}</span>
            </span>
          )}

          {/* Assigned To Chip */}
          {task.assignedTo && task.assignedTo.name && (
            <div className="assignee-chip" title={`Assigned to ${task.assignedTo.name} (${task.assignedTo.email || ''})`}>
              <div className="avatar" style={{ width: '18px', height: '18px', fontSize: '0.625rem' }}>
                {task.assignedTo.avatar || task.assignedTo.name.slice(0, 2).toUpperCase()}
              </div>
              <span>{task.assignedTo.name}</span>
            </div>
          )}

          {/* Need Help From Collaborator Chip */}
          {task.needHelpFrom && task.needHelpFrom.name && (
            <div 
              className="helper-chip" 
              title={task.needHelpFrom.topic ? `Help needed on: "${task.needHelpFrom.topic}"` : `Needs help from ${task.needHelpFrom.name}`}
            >
              <Users size={12} />
              <span>
                Need help from <strong>{task.needHelpFrom.name}</strong>
                {task.needHelpFrom.topic ? `: ${task.needHelpFrom.topic}` : ''}
              </span>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.map((tag, idx) => (
            <span 
              key={idx} 
              className="badge" 
              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)} style={{ zIndex: 1200 }}>
          <div 
            className="modal-dialog" 
            style={{ maxWidth: '420px', animation: 'modalFadeIn 0.15s ease' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title" style={{ color: 'var(--priority-urgent)' }}>
                <AlertTriangle size={18} color="var(--priority-urgent)" />
                <span>Confirm Delete</span>
              </div>
              <button 
                className="btn-icon" 
                onClick={() => setShowDeleteConfirm(false)} 
                type="button"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 20px', gap: '8px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text-main)' }}>"{task.title}"</strong>?
              </p>
              <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', margin: 0 }}>
                This action cannot be undone and will permanently remove this task.
              </p>
            </div>

            <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{ 
                  background: 'var(--priority-urgent)', 
                  color: '#ffffff', 
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => {
                  deleteTask(task.id);
                  setShowDeleteConfirm(false);
                }}
              >
                <Trash2 size={14} />
                <span>Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
