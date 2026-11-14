import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  Banknote, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Plus 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTasks } from '../../context/TaskContext';
import { TaskCard } from '../tasks/TaskCard';

export const EventCard = ({ 
  event, 
  onEditEvent, 
  onOpenNewTaskForEvent, 
  onEditTask,
  dateStr: propDateStr = null,
  initialExpanded = false
}) => {
  const { 
    tasks, 
    deleteEvent, 
    recurringDate 
  } = useTasks();

  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [deleteTargetEvent, setDeleteTargetEvent] = useState(null);
  const [deleteSubtasksAlso, setDeleteSubtasksAlso] = useState(true);

  const effectiveDate = propDateStr || recurringDate;
  const isRecurringEvent = event.eventType === 'recurring' || Boolean(event.recurrence && event.recurrence !== 'none');
  const accentColor = event.color || '#6366f1';

  // Child tasks belonging to this event
  const childTasks = tasks.filter((t) => t.eventId === event.id);

  // Completion calculation
  const totalSubtasks = childTasks.length;
  const completedSubtasks = childTasks.filter((t) => {
    const isRec = Boolean(t.recurrence && t.recurrence !== 'none');
    if (isRec) {
      return Array.isArray(t.completedDates) && t.completedDates.includes(effectiveDate);
    }
    return t.status === 'completed';
  }).length;

  const percentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
  const isAllDone = totalSubtasks > 0 && completedSubtasks === totalSubtasks;

  // Date range text (for normal events with explicit dates; no recurring tags/icons)
  const dateInfoText = (() => {
    if (event.startDate && event.endDate) {
      return `${format(parseISO(event.startDate), 'MMM d, yyyy')} – ${format(parseISO(event.endDate), 'MMM d, yyyy')}`;
    }
    if (event.startDate) return `Starts: ${format(parseISO(event.startDate), 'MMM d, yyyy')}`;
    if (event.endDate || event.dueDate) return `Target: ${format(parseISO(event.endDate || event.dueDate), 'MMM d, yyyy')}`;
    return null;
  })();

  return (
    <div 
      className={`event-folder-card event-card ${isExpanded ? 'expanded' : ''}`}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'visible',
        transition: 'all var(--transition-fast)',
        borderLeft: `5px solid ${accentColor}`,
        position: 'relative',
        zIndex: 1
      }}
    >
      {/* Event Header */}
      <div 
        className="event-folder-header"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          cursor: 'pointer',
          userSelect: 'none',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
          background: isExpanded ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
          transition: 'background var(--transition-fast)'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Left: Icon & Title & Metadata */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
          <div 
            style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '10px', 
              background: `${accentColor}18`, 
              color: accentColor, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '2px'
            }}
          >
            <Calendar size={20} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 
                style={{ 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  color: 'var(--text-main)', 
                  margin: 0,
                  wordBreak: 'break-word'
                }}
              >
                {event.title}
              </h3>

              <span className="badge" style={{ background: `${accentColor}18`, color: accentColor, borderColor: `${accentColor}33`, fontSize: '0.6875rem' }}>
                Event
              </span>

              {isAllDone && (
                <span className="badge badge-completed" style={{ fontSize: '0.6875rem' }}>
                  <CheckCircle2 size={11} />
                  <span>All Done</span>
                </span>
              )}

              {event.priority && (
                <span className={`badge badge-${event.priority}`} style={{ textTransform: 'capitalize', fontSize: '0.6875rem' }}>
                  {event.priority}
                </span>
              )}
            </div>

            {event.description && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                {event.description}
              </p>
            )}

            {/* Metadata Chips: Dates, Budget, Assignee */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              {dateInfoText && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} color="var(--primary)" />
                  <span>{dateInfoText}</span>
                </span>
              )}

              {event.amount !== undefined && event.amount !== null && event.amount !== '' && (
                <span className="badge badge-amount" style={{ fontSize: '0.6875rem' }}>
                  <Banknote size={10} />
                  <span>Budget: {event.currency || '₹'}{Number(event.amount).toLocaleString()}</span>
                </span>
              )}

              {event.assignedTo && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={12} />
                  <span>Lead: <strong>{event.assignedTo.name}</strong></span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions Toolbar & Expand Chevron */}
        <div 
          className="event-header-actions" 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Add Task */}
          <button 
            type="button" 
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
            onClick={() => onOpenNewTaskForEvent && onOpenNewTaskForEvent(event.id, isRecurringEvent)}
            title="Add Task to this Event"
          >
            <Plus size={13} />
            <span className="event-action-text">Add Task</span>
          </button>

          {/* Edit Event */}
          <button 
            type="button" 
            className="btn-icon" 
            style={{ width: '30px', height: '30px' }}
            onClick={() => onEditEvent && onEditEvent(event)}
            title="Edit Event"
          >
            <Edit3 size={14} />
          </button>

          {/* Delete Event */}
          <button 
            type="button" 
            className="btn-icon" 
            style={{ width: '30px', height: '30px', color: 'var(--priority-urgent)' }}
            onClick={() => setDeleteTargetEvent(event)}
            title="Delete Event"
          >
            <Trash2 size={14} />
          </button>

          {/* Expand/Collapse Chevron */}
          <button 
            type="button" 
            className="btn-icon" 
            style={{ width: '30px', height: '30px', color: 'var(--text-muted)' }}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse" : "Expand"}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Progress Bar Strip */}
      <div 
        className="event-folder-progress-bar-wrap"
        style={{
          padding: '8px 18px 10px',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
          background: isExpanded ? 'var(--bg-surface-elevated)' : 'transparent'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {totalSubtasks === 0 ? 'No tasks yet' : `${completedSubtasks} of ${totalSubtasks} tasks completed`}
            </span>
          </div>
          <span style={{ fontWeight: 700, color: percentage === 100 ? '#10b981' : accentColor }}>
            {percentage}%
          </span>
        </div>

        <div 
          className="card-steps-bar-track" 
          style={{ height: '6px', background: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden' }}
        >
          <div 
            className="card-steps-bar-fill" 
            style={{ 
              width: `${percentage}%`, 
              background: percentage === 100 ? '#10b981' : accentColor, 
              height: '100%',
              transition: 'width 0.3s ease'
            }} 
          />
        </div>
      </div>

      {/* Expanded Body: Subtasks rendered exactly like non-event tasks using TaskCard */}
      {isExpanded && (
        <div 
          className="event-folder-body" 
          style={{ 
            padding: '16px 18px', 
            background: 'var(--bg-app)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px',
            overflow: 'visible',
            borderBottomLeftRadius: 'var(--radius-lg)',
            borderBottomRightRadius: 'var(--radius-lg)'
          }}
        >
          {childTasks.length === 0 ? (
            <div 
              style={{ 
                padding: '22px 16px', 
                textAlign: 'center', 
                background: 'var(--bg-surface)', 
                borderRadius: 'var(--radius-md)', 
                border: '1px dashed var(--border-medium)',
                color: 'var(--text-muted)'
              }}
            >
              <p style={{ fontSize: '0.8125rem', margin: '0 0 10px' }}>
                No tasks in this event yet.
              </p>
              <button 
                type="button"
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.75rem', gap: '4px' }}
                onClick={() => onOpenNewTaskForEvent && onOpenNewTaskForEvent(event.id, isRecurringEvent)}
              >
                <Plus size={13} />
                <span>Add Task to this Event</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {childTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={onEditTask} 
                  isInsideEvent={true}
                  dateStr={effectiveDate}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Event Confirmation Modal */}
      {deleteTargetEvent && (
        <div 
          className="modal-overlay" 
          onClick={() => setDeleteTargetEvent(null)}
          style={{ zIndex: 1100 }}
        >
          <div 
            className="modal-dialog" 
            style={{ maxWidth: '440px' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} color="var(--priority-urgent)" />
                <span>Delete Event</span>
              </div>
              <button 
                type="button" 
                className="btn-icon" 
                onClick={() => setDeleteTargetEvent(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 0' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                Are you sure you want to delete event "<strong>{deleteTargetEvent.title}</strong>"?
              </p>

              {childTasks.length > 0 && (
                <label 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    fontSize: '0.8125rem', 
                    color: 'var(--text-main)', 
                    cursor: 'pointer',
                    background: 'var(--bg-surface-elevated)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={deleteSubtasksAlso} 
                    onChange={(e) => setDeleteSubtasksAlso(e.target.checked)} 
                    style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <span>Also delete all {childTasks.length} tasks inside this event</span>
                </label>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '12px 0 0 0', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setDeleteTargetEvent(null)}
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
                  boxShadow: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => {
                  deleteEvent(deleteTargetEvent.id, deleteSubtasksAlso);
                  setDeleteTargetEvent(null);
                }}
              >
                <Trash2 size={14} />
                <span>Delete Event</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
