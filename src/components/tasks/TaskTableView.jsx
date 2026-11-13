import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Check, 
  Flame, 
  AlertTriangle, 
  Clock, 
  ArrowDown, 
  Repeat, 
  Banknote, 
  Users, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Plus, 
  X,
  CheckCircle2,
  ListChecks,
  ChevronDown,
  ChevronUp,
  PauseCircle,
  PlayCircle,
  FolderKanban,
  FolderInput,
  FolderOutput
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { useTasks } from '../../context/TaskContext';
import { MoveTaskEventModal } from '../events/MoveTaskEventModal';

export const TaskTableView = ({ onEditTask, onOpenNewTask }) => {
  const { 
    filteredTasks, 
    tasks, 
    taskTypeTab,
    eventTasks,
    toggleTaskComplete, 
    toggleRecurringDateComplete,
    recurringDate,
    toggleTaskInProgress, 
    toggleTaskStep,
    toggleStopRecurrence,
    getRecurrenceLabel,
    deleteTask, 
    updateTask,
    searchQuery,
    filterPriority,
    filterStatus,
    filterNeedHelp,
    setSearchQuery,
    setFilterPriority,
    setFilterStatus,
    setFilterNeedHelp
  } = useTasks();

  const [deleteTargetTask, setDeleteTargetTask] = useState(null);
  const [activeStepsTaskId, setActiveStepsTaskId] = useState(null);
  const [moveTargetTask, setMoveTargetTask] = useState(null);

  // Close floating steps popover on click outside
  useEffect(() => {
    if (!activeStepsTaskId) return;
    const handleClickOutside = (e) => {
      if (e.target.closest('.table-steps-container')) return;
      setActiveStepsTaskId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeStepsTaskId]);

  const isFiltering = searchQuery || filterPriority !== 'all' || filterStatus !== 'all' || filterNeedHelp;

  const handleCyclePriority = (e, task) => {
    e.stopPropagation();
    const priorityOrder = ['low', 'medium', 'high', 'urgent'];
    const currentIndex = priorityOrder.indexOf(task.priority);
    const nextPriority = priorityOrder[(currentIndex + 1) % priorityOrder.length];
    updateTask(task.id, { priority: nextPriority });
  };

  const getDueDateDisplay = (dateString, isCompleted) => {
    if (!dateString) return null;
    try {
      const parsed = parseISO(dateString);
      if (isNaN(parsed.getTime())) return dateString;
      if (isToday(parsed)) return { text: 'Today', class: 'today' };
      if (isTomorrow(parsed)) return { text: 'Tomorrow', class: 'tomorrow' };
      if (isPast(parsed) && !isCompleted) return { text: `Overdue (${format(parsed, 'MMM d')})`, class: 'overdue' };
      return { text: format(parsed, 'MMM d, yyyy'), class: 'normal' };
    } catch {
      return { text: dateString, class: 'normal' };
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <Flame size={12} />;
      case 'high': return <AlertTriangle size={12} />;
      case 'medium': return <Clock size={12} />;
      case 'low': return <ArrowDown size={12} />;
      default: return null;
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Check size={32} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>No tasks yet</h3>
          <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>Get started by creating your first task.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button className="btn btn-primary" onClick={onOpenNewTask}>
            <Plus size={16} />
            <span>Create Task</span>
          </button>
        </div>
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    if (isFiltering) {
      return (
        <div className="empty-state">
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
      <div className="empty-state">
        <div className="empty-state-icon">
          <Check size={32} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {taskTypeTab === 'recurring' ? 'No recurring tasks scheduled for this date' : 'No tasks found'}
          </h3>
          <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>
            {taskTypeTab === 'recurring'
              ? 'Use the arrows above to navigate dates or create a recurring task.'
              : 'Get started by creating your first task.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button className="btn btn-primary" onClick={onOpenNewTask}>
            <Plus size={16} />
            <span>Create Task</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="task-table-container">
      <table className="task-table">
        <thead>
          <tr>
            <th style={{ width: '50px', textAlign: 'center' }}>Done</th>
            <th style={{ minWidth: '220px' }}>Task</th>
            <th style={{ width: '110px' }}>Status</th>
            <th style={{ width: '110px' }}>Priority</th>
            <th style={{ width: '140px' }}>Due Date</th>
            <th style={{ width: '110px' }}>Recurrence</th>
            <th style={{ width: '110px' }}>Amount</th>
            <th style={{ width: '160px' }}>Assignee</th>
            <th style={{ width: '120px' }}>Tags</th>
            <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((task) => {
            const isRecurring = Boolean(task.recurrence && task.recurrence !== 'none');
            const recurringDoneSteps = isRecurring && task.hasSteps && Array.isArray(task.steps)
              ? (task.completedStepsByDate?.[recurringDate]?.length || 0)
              : 0;
            const isCompleted = isRecurring
              ? Boolean(task.completedDates?.includes(recurringDate))
              : task.status === 'completed';
            const isInProgress = isRecurring
              ? (!isCompleted && recurringDoneSteps > 0)
              : task.status === 'in_progress';
            const dueInfo = getDueDateDisplay(task.dueDate, isCompleted);

            return (
              <tr key={task.id} className={`${isCompleted ? 'completed' : ''} ${activeStepsTaskId === task.id ? 'has-floating-menu-open' : ''}`}>
                {/* Checkbox */}
                <td style={{ textAlign: 'center' }}>
                  <div 
                    className={`custom-checkbox ${isCompleted ? 'checked' : ''}`}
                    onClick={() => {
                      if (isRecurring) {
                        toggleRecurringDateComplete(task.id, recurringDate);
                      } else {
                        toggleTaskComplete(task.id);
                      }
                    }}
                    title={isCompleted ? "Mark as Incomplete" : "Mark as Completed"}
                    style={{ margin: '0 auto' }}
                  >
                    {isCompleted && <Check size={14} />}
                  </div>
                </td>

                {/* Title & Description */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="table-task-title">{task.title}</span>
                    {task.eventId && (() => {
                      const parentEvent = eventTasks?.find(e => e.id === task.eventId);
                      if (!parentEvent) return null;
                      return (
                        <span 
                          className="badge" 
                          style={{ 
                            fontSize: '0.625rem', 
                            padding: '1px 5px',
                            background: `${parentEvent.color || '#6366f1'}15`, 
                            color: parentEvent.color || '#6366f1',
                            border: `1px solid ${parentEvent.color || '#6366f1'}35`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title={`Part of Event Folder: ${parentEvent.title}`}
                        >
                          <FolderKanban size={9} />
                          <span>{parentEvent.title}</span>
                        </span>
                      );
                    })()}
                  </div>
                  {task.description && (
                    <div className="table-task-desc" title={task.description}>
                      {task.description}
                    </div>
                  )}

                  {/* Multi-Step Checklist for Table View */}
                  {task.hasSteps && Array.isArray(task.steps) && task.steps.length > 0 && (() => {
                    const completedStepsCount = isRecurring
                      ? (task.completedStepsByDate?.[recurringDate]?.length || 0)
                      : task.steps.filter((s) => s.completed).length;
                    const totalStepsCount = task.steps.length;
                    const isExpanded = activeStepsTaskId === task.id;
                    const percentage = Math.round((completedStepsCount / totalStepsCount) * 100);

                    return (
                      <div className={`table-steps-container ${isExpanded ? 'menu-open' : ''}`}>
                        <button
                          type="button"
                          className="table-steps-toggle-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveStepsTaskId((prev) => (prev === task.id ? null : task.id));
                          }}
                          title={isExpanded ? "Close subtasks menu" : "Click to view / complete subtasks in menu"}
                        >
                          <ListChecks size={12} color="var(--primary)" />
                          <span>{completedStepsCount}/{totalStepsCount} steps ({percentage}%)</span>
                          {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>

                        {/* Floating Menu Popover (Does NOT expand the table row) */}
                        {isExpanded && (
                          <div 
                            className="table-steps-floating-menu"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="card-steps-floating-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ListChecks size={13} color="var(--primary)" />
                                <span className="card-steps-floating-title">Subtasks</span>
                                <span className={`card-steps-pill ${percentage === 100 ? 'done' : ''}`}>
                                  {completedStepsCount}/{totalStepsCount} ({percentage}%)
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
                              {task.steps.map((step, idx) => {
                                const isStepDone = isRecurring
                                  ? Boolean(task.completedStepsByDate?.[recurringDate]?.includes(step.id))
                                  : Boolean(step.completed);

                                return (
                                  <div
                                    key={step.id || idx}
                                    className={`card-step-row ${isStepDone ? 'completed' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isRecurring) {
                                        toggleTaskStep(task.id, step.id, recurringDate);
                                      } else {
                                        toggleTaskStep(task.id, step.id);
                                      }
                                    }}
                                  >
                                    <div
                                      className={`custom-checkbox card-step-checkbox ${isStepDone ? 'checked' : ''}`}
                                      title={isStepDone ? "Mark step incomplete" : "Mark step complete"}
                                    >
                                      {isStepDone && <Check size={10} />}
                                    </div>
                                    <span className="card-step-text">{step.title}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </td>

                {/* Status Toggle */}
                <td>
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
                      title="Click to mark To Do"
                    >
                      <span className="status-dot-pulse" />
                      <span>In Progress</span>
                    </span>
                  ) : (
                    <span 
                      className="badge badge-todo"
                      onClick={() => toggleTaskInProgress(task.id)}
                      style={{ cursor: 'pointer' }}
                      title="Click to mark In Progress"
                    >
                      <span>To Do</span>
                    </span>
                  )}
                </td>

                {/* Priority */}
                <td>
                  <span 
                    className={`badge badge-${task.priority} priority-clickable`}
                    onClick={(e) => handleCyclePriority(e, task)}
                    title="Click to cycle priority"
                  >
                    {getPriorityIcon(task.priority)}
                    <span style={{ textTransform: 'capitalize' }}>{task.priority}</span>
                  </span>
                </td>

                {/* Due Date & Completion Date */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                    {dueInfo ? (
                      <span className={`badge badge-date ${dueInfo.class}`}>
                        {dueInfo.text}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                    )}

                    {(() => {
                      const doneDateStr = isRecurring
                        ? (isCompleted ? (task.completedAtByDate?.[recurringDate] || recurringDate) : null)
                        : (isCompleted ? task.completedAt : null);
                      if (!doneDateStr) return null;
                      let formattedDone = doneDateStr;
                      try {
                        const parsed = parseISO(doneDateStr);
                        if (!isNaN(parsed.getTime())) formattedDone = format(parsed, 'MMM d');
                      } catch (e) {}

                      return (
                        <span 
                          className="badge badge-completed" 
                          title={`Completed on ${doneDateStr}`}
                          style={{ fontSize: '0.6875rem', padding: '2px 6px' }}
                        >
                          <CheckCircle2 size={10} />
                          <span>Done {formattedDone}</span>
                        </span>
                      );
                    })()}
                  </div>
                </td>

                {/* Recurrence */}
                <td>
                  {task.recurrence && task.recurrence !== 'none' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                      <span className="badge badge-recurrence">
                        <Repeat size={11} />
                        <span>{getRecurrenceLabel(task)}</span>
                      </span>
                      {task.isRecurringStopped && (
                        <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--priority-urgent)', borderColor: 'rgba(239, 68, 68, 0.25)', fontSize: '0.625rem', padding: '1px 5px' }}>
                          ⏸ Stopped
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                  )}
                </td>

                {/* Amount */}
                <td>
                  {task.amount !== undefined && task.amount !== null && task.amount !== '' ? (
                    <span className="badge badge-amount">
                      <Banknote size={12} />
                      <span>{task.currency || '₹'}{Number(task.amount).toLocaleString()}</span>
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                  )}
                </td>

                {/* Assignee / Helper */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {task.assignedTo && task.assignedTo.name ? (
                      <div className="assignee-chip" style={{ width: 'fit-content' }}>
                        <div className="avatar" style={{ width: '16px', height: '16px', fontSize: '0.5625rem' }}>
                          {task.assignedTo.avatar || task.assignedTo.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{task.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Unassigned</span>
                    )}

                    {task.needHelpFrom && task.needHelpFrom.name && (
                      <div className="helper-chip" style={{ width: 'fit-content', padding: '2px 6px', fontSize: '0.6875rem' }}>
                        <Users size={10} />
                        <span>{task.needHelpFrom.name}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Tags */}
                <td>
                  {task.tags && task.tags.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {task.tags.map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="badge" 
                          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '0.6875rem' }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                  )}
                </td>

                {/* Actions */}
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {task.recurrence && task.recurrence !== 'none' && (
                      <button
                        type="button"
                        className={`btn-stop-recurrence ${task.isRecurringStopped ? 'resume' : 'stop'}`}
                        onClick={() => toggleStopRecurrence(task.id)}
                        title={task.isRecurringStopped ? "Resume recurring schedule" : "Stop recurrence for this task"}
                      >
                        {task.isRecurringStopped ? <PlayCircle size={11} /> : <PauseCircle size={11} />}
                        <span>{task.isRecurringStopped ? 'Resume' : 'Stop'}</span>
                      </button>
                    )}
                    <button 
                      type="button"
                      className="btn-icon" 
                      style={{ width: '28px', height: '28px', color: task.eventId ? 'var(--primary)' : 'var(--text-muted)' }} 
                      onClick={() => setMoveTargetTask(task)}
                      title={task.eventId ? "Change or remove from Event Folder" : "Move into an Event Folder"}
                    >
                      {task.eventId ? <FolderOutput size={13} /> : <FolderInput size={13} />}
                    </button>
                    <button 
                      className="btn-icon" 
                      style={{ width: '28px', height: '28px' }} 
                      onClick={() => onEditTask(task)}
                      title="Edit Task"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button 
                      className="btn-icon" 
                      style={{ width: '28px', height: '28px', color: 'var(--priority-urgent)' }} 
                      onClick={() => setDeleteTargetTask(task)}
                      title="Delete Task"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Delete Confirmation Modal rendered to body via Portal */}
      {deleteTargetTask && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteTargetTask(null)} style={{ zIndex: 9999 }}>
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
                onClick={() => setDeleteTargetTask(null)} 
                type="button"
                title="Cancel"
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
        </div>,
        document.body
      )}

      {/* Move Task to/from Event Modal */}
      <MoveTaskEventModal
        isOpen={Boolean(moveTargetTask)}
        onClose={() => setMoveTargetTask(null)}
        task={moveTargetTask}
        onOpenNewEvent={onOpenNewTask}
      />
    </div>
  );
};
