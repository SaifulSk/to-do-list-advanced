import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Calendar, 
  Plus, 
  Clock, 
  Flame, 
  AlertTriangle, 
  ArrowDown, 
  Users, 
  Check, 
  Repeat, 
  Banknote, 
  CheckCircle2, 
  ListChecks, 
  Edit3, 
  Trash2, 
  PlayCircle, 
  PauseCircle, 
  ChevronDown, 
  ChevronUp,
  FolderInput,
  FolderOutput
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTasks } from '../../context/TaskContext';
import { MoveTaskEventModal } from '../events/MoveTaskEventModal';
import { EventCard } from '../events/EventCard';

export const CalendarDayModal = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  tasksForDay = [], 
  onAddTaskForDate, 
  onEditTask,
  onOpenNewEvent,
  onOpenNewTaskForEvent
}) => {
  const { 
    tasks, 
    toggleTaskComplete, 
    toggleRecurringDateComplete, 
    toggleStopRecurrence, 
    toggleTaskStep, 
    deleteTask, 
    getRecurrenceLabel 
  } = useTasks();

  const [activeStepsTaskId, setActiveStepsTaskId] = useState(null);
  const [deleteTargetTask, setDeleteTargetTask] = useState(null);
  const [moveTargetTask, setMoveTargetTask] = useState(null);

  // Close floating subtasks menu when clicking outside
  useEffect(() => {
    if (!activeStepsTaskId) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.card-steps-section')) {
        setActiveStepsTaskId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeStepsTaskId]);

  if (!isOpen || !selectedDate) return null;

  const formattedDate = format(selectedDate, 'EEEE, MMMM d, yyyy');
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const recurringTasks = tasksForDay.filter((item) => item.type === 'recurring');
  const createdTasks = tasksForDay.filter((item) => item.type === 'created');
  const dueTasks = tasksForDay.filter((item) => item.type === 'due');
  const eventTasksForDay = tasksForDay.filter((item) => item.type === 'event');

  const renderTaskCard = (item) => {
    // Lookup latest task state from context
    const currentTask = tasks.find((t) => t.id === item.task.id) || item.task;
    const isRecurring = item.type === 'recurring';
    const isCompleted = isRecurring
      ? Boolean(currentTask.completedDates?.includes(dateStr))
      : currentTask.status === 'completed';

    const menuKey = `${item.type}-${currentTask.id}`;
    const isStepsOpen = activeStepsTaskId === menuKey;

    return (
      <div 
        key={menuKey}
        className={`task-card priority-${currentTask.priority} ${isCompleted ? 'completed' : ''} ${isStepsOpen ? 'has-floating-menu-open' : ''}`}
        style={{ padding: '12px 14px', cursor: 'default' }}
      >
        {/* Interactive Checkbox */}
        <div 
          className={`custom-checkbox ${isCompleted ? 'checked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (isRecurring) {
              toggleRecurringDateComplete(currentTask.id, dateStr);
            } else {
              toggleTaskComplete(currentTask.id);
            }
          }}
          title={isCompleted ? "Mark as Incomplete" : isRecurring ? "Mark as Completed for this date" : "Mark as Completed"}
          style={{ marginTop: '2px', flexShrink: 0 }}
        >
          {isCompleted && <Check size={14} />}
        </div>

        {/* Task Content */}
        <div className="task-content" style={{ flex: 1, minWidth: 0 }}>
          <div className="task-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <h4 
              className="task-title" 
              style={{ 
                fontSize: '0.875rem', 
                fontWeight: 700, 
                margin: 0, 
                color: 'var(--text-main)', 
                wordBreak: 'break-word',
                lineHeight: 1.35
              }}
            >
              {currentTask.title}
            </h4>

            {/* Action Buttons as in List and Table view */}
            <div className="task-actions" style={{ gap: '6px', flexShrink: 0 }}>
              {isRecurring && (
                <button
                  type="button"
                  className={`btn-stop-recurrence ${currentTask.isRecurringStopped ? 'resume' : 'stop'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStopRecurrence(currentTask.id);
                  }}
                  title={currentTask.isRecurringStopped ? "Resume recurring schedule" : "Stop recurrence for this task"}
                >
                  {currentTask.isRecurringStopped ? <PlayCircle size={11} /> : <PauseCircle size={11} />}
                  <span>{currentTask.isRecurringStopped ? 'Resume' : 'Stop'}</span>
                </button>
              )}
              <button 
                type="button"
                className="btn-icon" 
                style={{ width: '28px', height: '28px', color: currentTask.eventId ? 'var(--primary)' : 'var(--text-muted)' }} 
                onClick={(e) => {
                  e.stopPropagation();
                  setMoveTargetTask(currentTask);
                }}
                title={currentTask.eventId ? "Change or remove from Event" : "Move into an Event"}
              >
                {currentTask.eventId ? <FolderOutput size={13} /> : <FolderInput size={13} />}
              </button>
              <button 
                type="button"
                className="btn-icon" 
                style={{ width: '28px', height: '28px' }} 
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  onEditTask(currentTask);
                }}
                title="Edit Task"
              >
                <Edit3 size={13} />
              </button>
              <button 
                type="button"
                className="btn-icon" 
                style={{ width: '28px', height: '28px', color: 'var(--priority-urgent)' }} 
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTargetTask(currentTask);
                }}
                title="Delete Task"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Task Description */}
          {currentTask.description && (
            <p className="task-desc" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
              {currentTask.description}
            </p>
          )}

          {/* Multi-Step Checklist */}
          {currentTask.hasSteps && Array.isArray(currentTask.steps) && currentTask.steps.length > 0 && (() => {
            const completedCount = isRecurring
              ? (currentTask.completedStepsByDate?.[dateStr]?.length || 0)
              : currentTask.steps.filter((s) => s.completed).length;
            const totalCount = currentTask.steps.length;
            const percentage = Math.round((completedCount / totalCount) * 100);

            return (
              <div 
                className={`card-steps-section ${isStepsOpen ? 'menu-open' : ''}`}
                style={{ marginTop: '8px' }}
              >
                <div 
                  className="card-steps-header" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveStepsTaskId(isStepsOpen ? null : menuKey);
                  }}
                  title={isStepsOpen ? "Close subtasks menu" : "Click to view subtasks"}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ListChecks size={13} color="var(--primary)" />
                    <span className="card-steps-label">
                      Steps ({completedCount}/{totalCount})
                    </span>
                    <span className={`card-steps-pill ${percentage === 100 ? 'done' : ''}`}>
                      {percentage}%
                    </span>
                  </div>
                  <button 
                    type="button" 
                    className="btn-icon" 
                    style={{ width: '20px', height: '20px', padding: 0 }}
                    aria-label={isStepsOpen ? "Close subtasks menu" : "Open subtasks menu"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveStepsTaskId(isStepsOpen ? null : menuKey);
                    }}
                  >
                    {isStepsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="card-steps-bar-track">
                  <div 
                    className="card-steps-bar-fill" 
                    style={{ 
                      width: `${percentage}%`,
                      background: percentage === 100 ? '#10b981' : 'var(--primary)' 
                    }} 
                  />
                </div>

                {/* Floating Menu Popover */}
                {isStepsOpen && (
                  <div 
                    className="card-steps-floating-menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="card-steps-floating-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ListChecks size={13} color="var(--primary)" />
                        <span className="card-steps-floating-title">Subtasks</span>
                        <span className={`card-steps-pill ${percentage === 100 ? 'done' : ''}`}>
                          {completedCount}/{totalCount} ({percentage}%)
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-icon card-steps-floating-close"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStepsTaskId(null);
                        }}
                        title="Close"
                        aria-label="Close subtasks menu"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <div className="card-steps-floating-list">
                      {currentTask.steps.map((step, idx) => {
                        const isStepDone = isRecurring
                          ? Boolean(currentTask.completedStepsByDate?.[dateStr]?.includes(step.id))
                          : Boolean(step.completed);

                        return (
                          <div 
                            key={step.id || idx} 
                            className={`card-step-row ${isStepDone ? 'completed' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isRecurring) {
                                toggleTaskStep(currentTask.id, step.id, dateStr);
                              } else {
                                toggleTaskStep(currentTask.id, step.id);
                              }
                            }}
                          >
                            <div 
                              className={`custom-checkbox card-step-checkbox ${isStepDone ? 'checked' : ''}`}
                              title={isStepDone ? "Mark step incomplete" : "Mark step complete"}
                            >
                              {isStepDone && <Check size={10} />}
                            </div>
                            <span className="card-step-text">
                              {step.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Badges and Metadata */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            {currentTask.recurrence && currentTask.recurrence !== 'none' && (
              <span className="badge badge-recurrence" style={{ fontSize: '0.6875rem' }}>
                <Repeat size={10} />
                <span>{getRecurrenceLabel(currentTask)}</span>
              </span>
            )}
            {currentTask.amount !== undefined && currentTask.amount !== null && currentTask.amount !== '' && (
              <span className="badge badge-amount" style={{ fontSize: '0.6875rem' }}>
                <Banknote size={10} />
                <span>{currentTask.currency || '₹'}{Number(currentTask.amount).toLocaleString()}</span>
              </span>
            )}
            {isCompleted && (
              <span 
                className="badge badge-completed" 
                style={{ fontSize: '0.6875rem' }}
                title={isRecurring ? `Completed on ${currentTask.completedAtByDate?.[dateStr] || dateStr}` : `Completed on ${currentTask.completedAt || ''}`}
              >
                <CheckCircle2 size={10} />
                <span>Done</span>
              </span>
            )}
            <span className={`badge badge-${currentTask.priority}`} style={{ textTransform: 'capitalize', fontSize: '0.6875rem' }}>
              {currentTask.priority}
            </span>
            {item.type === 'created' && currentTask.dueDate && (
              <span style={{ fontSize: '0.75rem' }}>Target Due: {currentTask.dueDate}</span>
            )}
            {currentTask.assignedTo && (
              <span style={{ fontSize: '0.75rem' }}>Assignee: <strong>{currentTask.assignedTo.name}</strong></span>
            )}
            {currentTask.needHelpFrom && (
              <span style={{ color: 'var(--help-accent)', fontSize: '0.75rem' }}>
                🤝 Needs help from {currentTask.needHelpFrom.name}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const modalJSX = (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-dialog" 
        style={{ maxWidth: '640px', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Calendar size={18} color="var(--primary)" />
            <span>{formattedDate}</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          {/* Quick Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Tasks schedule & timeline for this day
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
                onClick={() => {
                  onClose();
                  onAddTaskForDate(dateStr);
                }}
              >
                <Plus size={14} />
                <span>Add Task</span>
              </button>
              {onOpenNewEvent && (
                <button 
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
                  onClick={() => {
                    onClose();
                    onOpenNewEvent();
                  }}
                >
                  <Calendar size={14} />
                  <span>Add Event</span>
                </button>
              )}
            </div>
          </div>

          {/* Recurring Tasks For This Day */}
          {recurringTasks.length > 0 && (
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div className="legend-dot" style={{ background: '#6366f1' }} />
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#6366f1', margin: 0 }}>
                  Recurring Tasks on this day ({recurringTasks.length})
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recurringTasks.map((item) => renderTaskCard(item))}
              </div>
            </div>
          )}

          {/* Event Tasks For This Day (Rendered in List View Format) */}
          {eventTasksForDay.length > 0 && (
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div className="legend-dot" style={{ background: '#ec4899' }} />
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ec4899', margin: 0 }}>
                  Events on this day ({eventTasksForDay.length})
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {eventTasksForDay.map((item) => (
                  <EventCard 
                    key={`event-${item.task.id}`}
                    event={item.task}
                    dateStr={dateStr}
                    onEditEvent={onEditTask}
                    onOpenNewTaskForEvent={onOpenNewTaskForEvent}
                    onEditTask={onEditTask}
                    initialExpanded={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Due On This Day */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div className="legend-dot due" />
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--marker-due)', margin: 0 }}>
                Due on this day ({dueTasks.length})
              </h4>
            </div>

            {dueTasks.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '16px' }}>
                No tasks due on this date.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dueTasks.map((item) => renderTaskCard(item))}
              </div>
            )}
          </div>

          {/* Created On This Day */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div className="legend-dot created" />
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--marker-created)', margin: 0 }}>
                Created on this day ({createdTasks.length})
              </h4>
            </div>

            {createdTasks.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '16px' }}>
                No tasks were created on this date.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {createdTasks.map((item) => renderTaskCard(item))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetTask && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 1100 }} 
          onClick={() => setDeleteTargetTask(null)}
        >
          <div 
            className="modal-dialog" 
            style={{ maxWidth: '420px' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--priority-urgent)' }}>
                <AlertTriangle size={18} />
                <span style={{ fontWeight: 700 }}>Confirm Deletion</span>
              </div>
              <button 
                type="button" 
                className="btn-icon" 
                onClick={() => setDeleteTargetTask(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 20px', gap: '8px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text-main)' }}>"{deleteTargetTask.title}"</strong>?
              </p>
              <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', margin: 0 }}>
                This action cannot be undone and will permanently remove this task.
              </p>
            </div>

            <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setDeleteTargetTask(null)}
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
                  deleteTask(deleteTargetTask.id);
                  setDeleteTargetTask(null);
                }}
              >
                <Trash2 size={14} />
                <span>Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Task to/from Event Modal */}
      <MoveTaskEventModal
        isOpen={Boolean(moveTargetTask)}
        onClose={() => setMoveTargetTask(null)}
        task={moveTargetTask}
      />
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null;
};
