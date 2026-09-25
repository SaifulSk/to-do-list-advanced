import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  X,
  Repeat,
  Banknote,
  CheckCircle2
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import { useTasks } from '../../context/TaskContext';

export const TaskCard = ({ task, onEdit }) => {
  const { toggleTaskComplete, deleteTask, toggleTaskInProgress, updateTask } = useTasks();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';

  // Instant Priority Cycler: Low -> Medium -> High -> Urgent -> Low
  const handleCyclePriority = (e) => {
    e.stopPropagation();
    const priorityOrder = ['low', 'medium', 'high', 'urgent'];
    const currentIndex = priorityOrder.indexOf(task.priority);
    const nextPriority = priorityOrder[(currentIndex + 1) % priorityOrder.length];
    updateTask(task.id, { priority: nextPriority });
  };

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

  // Format Completed Date helper
  const getCompletedDateDisplay = (dateString) => {
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
  const completedDate = getCompletedDateDisplay(task.completedAt);

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

          {/* Priority Pill - Clickable to cycle instantly */}
          <span 
            className={`badge badge-${task.priority} priority-clickable`}
            onClick={handleCyclePriority}
            title={`Priority: ${task.priority.toUpperCase()}. Click to change priority.`}
          >
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

          {/* Completed Date Badge */}
          {completedDate && (
            <span className="badge badge-completed" title={`Completed on ${task.completedAt}`}>
              <CheckCircle2 size={12} />
              <span>Done {completedDate}</span>
            </span>
          )}

          {/* Created Date Badge */}
          {createdDate && (
            <span className="badge badge-date" title={`Created on ${task.createdAt}`} style={{ opacity: 0.8 }}>
              <Clock size={12} />
              <span>Created {createdDate}</span>
            </span>
          )}

          {/* Recurrence Badge */}
          {task.recurrence && task.recurrence !== 'none' && (
            <span className="badge badge-recurrence" title={`Recurring: repeats ${task.recurrence}`}>
              <Repeat size={11} />
              <span style={{ textTransform: 'capitalize' }}>{task.recurrence}</span>
            </span>
          )}

          {/* Amount Badge */}
          {task.amount !== undefined && task.amount !== null && task.amount !== '' && (
            <span className="badge badge-amount" title={`Amount: ${task.currency || '₹'}${Number(task.amount).toLocaleString()}`}>
              <Banknote size={12} />
              <span>{task.currency || '₹'}{Number(task.amount).toLocaleString()}</span>
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

      {/* Delete Confirmation Modal rendered to body via Portal */}
      {showDeleteConfirm && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)} style={{ zIndex: 9999 }}>
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
        </div>,
        document.body
      )}
    </div>
  );
};
