import React from 'react';
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
  HelpCircle
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import { useTasks } from '../../context/TaskContext';

export const TaskCard = ({ task, onEdit }) => {
  const { toggleTaskComplete, deleteTask } = useTasks();

  const isCompleted = task.status === 'completed';

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
    <div className={`task-card priority-${task.priority} ${isCompleted ? 'completed' : ''}`}>
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
              onClick={() => deleteTask(task.id)}
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

        {/* Metadata Row: Priority, Due Date, Created Date, Assigned To, Need Help From */}
        <div className="task-metadata">
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
    </div>
  );
};
