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
  ChevronRight,
  PauseCircle, 
  PlayCircle, 
  Calendar,
  FolderInput, 
  FolderOutput 
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { useTasks } from '../../context/TaskContext';
import { MoveTaskEventModal } from '../events/MoveTaskEventModal';

export const TaskTableView = ({ 
  onEditTask, 
  onOpenNewTask, 
  onOpenNewEvent, 
  onOpenNewTaskForEvent 
}) => {
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
    deleteEvent,
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
  const [deleteTargetEvent, setDeleteTargetEvent] = useState(null);
  const [deleteSubtasksAlso, setDeleteSubtasksAlso] = useState(true);
  const [activeStepsTaskId, setActiveStepsTaskId] = useState(null);
  const [moveTargetTask, setMoveTargetTask] = useState(null);
  const [expandedEventIds, setExpandedEventIds] = useState(() => new Set());

  const toggleEventExpand = (eventId) => {
    setExpandedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };



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
          <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>Get started by creating your first task or event.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onOpenNewTask}>
            <Plus size={16} />
            <span>Create Task</span>
          </button>
          {onOpenNewEvent && (
            <button className="btn btn-secondary" onClick={onOpenNewEvent}>
              <Calendar size={16} />
              <span>Create Event</span>
            </button>
          )}
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
          {taskTypeTab === 'recurring' ? <Repeat size={32} /> : <Check size={32} />}
        </div>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {taskTypeTab === 'recurring' ? 'No recurring tasks scheduled for this date' : 'No tasks found'}
          </h3>
          <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>
            {taskTypeTab === 'recurring'
              ? 'Use the date picker above or create a recurring task or recurring event.'
              : 'Get started by creating your first task or event.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onOpenNewTask}>
            <Plus size={16} />
            <span>Create Task</span>
          </button>
          {onOpenNewEvent && (
            <button className="btn btn-secondary" onClick={onOpenNewEvent}>
              <Calendar size={16} />
              <span>Create Event</span>
            </button>
          )}
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
            <th style={{ width: '110px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((task) => {
            // Case 1: Event Task Row in Table View
            if (task.isEvent) {
              const isExpanded = expandedEventIds.has(task.id);
              const accentColor = task.color || '#6366f1';
              const isRecurringEvent = task.eventType === 'recurring' || Boolean(task.recurrence && task.recurrence !== 'none');
              const childTasks = tasks.filter((t) => t.eventId === task.id);
              const totalCount = childTasks.length;
              const completedCount = childTasks.filter((t) => {
                if (isRecurringEvent || (t.recurrence && t.recurrence !== 'none')) {
                  return Array.isArray(t.completedDates) && t.completedDates.includes(recurringDate);
                }
                return t.status === 'completed';
              }).length;
              const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              const isAllDone = totalCount > 0 && completedCount === totalCount;

              const dateText = (() => {
                if (isRecurringEvent && task.recurrence && task.recurrence !== 'none') {
                  return getRecurrenceLabel(task);
                }
                if (task.startDate && task.endDate) {
                  return `${format(parseISO(task.startDate), 'MMM d')} – ${format(parseISO(task.endDate), 'MMM d')}`;
                }
                if (task.startDate) return `Starts: ${format(parseISO(task.startDate), 'MMM d')}`;
                if (task.endDate || task.dueDate) return `Target: ${format(parseISO(task.endDate || task.dueDate), 'MMM d')}`;
                return '—';
              })();

              return (
                <React.Fragment key={task.id}>
                  {/* Event Summary Row */}
                  <tr 
                    className={`event-table-row ${isExpanded ? 'expanded' : ''}`}
                    style={{ 
                      background: 'var(--bg-surface-elevated)', 
                      borderLeft: `4px solid ${accentColor}`,
                      fontWeight: 600
                    }}
                  >
                    {/* Expand/Collapse Toggle */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ width: '26px', height: '26px', margin: '0 auto', color: accentColor }}
                        onClick={() => toggleEventExpand(task.id)}
                        title={isExpanded ? "Collapse Event" : "Expand Event"}
                      >
                        {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </button>
                    </td>

                    {/* Event Title */}
                    <td>
                      <div 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        onClick={() => toggleEventExpand(task.id)}
                      >
                        <div 
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '6px', 
                            background: `${accentColor}18`, 
                            color: accentColor, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {isRecurringEvent ? <Repeat size={13} /> : <Calendar size={13} />}
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                          {task.title}
                        </span>
                        <span className="badge" style={{ background: `${accentColor}15`, color: accentColor, borderColor: `${accentColor}33`, fontSize: '0.625rem', padding: '1px 5px' }}>
                          {isRecurringEvent ? 'Recurring Event' : 'Event'}
                        </span>
                        <span className="badge" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>
                          {totalCount} {totalCount === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                      {task.description && (
                        <div className="table-task-desc" style={{ paddingLeft: '32px' }} title={task.description}>
                          {task.description}
                        </div>
                      )}
                    </td>

                    {/* Progress / Status */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '85px' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: isAllDone ? '#10b981' : accentColor }}>
                          {totalCount === 0 ? 'No tasks' : `${completedCount}/${totalCount} (${percentage}%)`}
                        </span>
                        <div className="card-steps-bar-track" style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div 
                            className="card-steps-bar-fill" 
                            style={{ 
                              width: `${percentage}%`, 
                              background: isAllDone ? '#10b981' : accentColor, 
                              height: '100%' 
                            }} 
                          />
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td>
                      <span className={`badge badge-${task.priority}`} style={{ textTransform: 'capitalize', fontSize: '0.6875rem' }}>
                        {task.priority}
                      </span>
                    </td>

                    {/* Date */}
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {dateText}
                      </span>
                    </td>

                    {/* Recurrence */}
                    <td>
                      {isRecurringEvent && task.recurrence && task.recurrence !== 'none' ? (
                        <span className="badge badge-recurrence" style={{ fontSize: '0.6875rem' }}>
                          <Repeat size={10} />
                          <span>{getRecurrenceLabel(task)}</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td>
                      {task.amount !== undefined && task.amount !== null && task.amount !== '' ? (
                        <span className="badge badge-amount" style={{ fontSize: '0.6875rem' }}>
                          <Banknote size={10} />
                          <span>{task.currency || '₹'}{Number(task.amount).toLocaleString()}</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>

                    {/* Assignee / Lead */}
                    <td>
                      {task.assignedTo && task.assignedTo.name ? (
                        <div className="assignee-chip" style={{ width: 'fit-content' }}>
                          <div className="avatar" style={{ width: '16px', height: '16px', fontSize: '0.5625rem' }}>
                            {task.assignedTo.avatar || task.assignedTo.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{task.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
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
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '0.6875rem', gap: '3px' }}
                          onClick={() => onOpenNewTaskForEvent && onOpenNewTaskForEvent(task.id, isRecurringEvent)}
                          title="Add Task to this Event"
                        >
                          <Plus size={11} />
                          <span>Task</span>
                        </button>

                        <button 
                          type="button"
                          className="btn-icon" 
                          style={{ width: '26px', height: '26px' }} 
                          onClick={() => onEditTask(task)}
                          title="Edit Event"
                        >
                          <Edit3 size={13} />
                        </button>

                        <button 
                          type="button"
                          className="btn-icon" 
                          style={{ width: '26px', height: '26px', color: 'var(--priority-urgent)' }} 
                          onClick={() => setDeleteTargetEvent(task)}
                          title="Delete Event"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Subtasks Row */}
                  {isExpanded && (
                    <tr className="event-table-expanded-row">
                      <td colSpan={10} style={{ padding: '10px 18px', background: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {childTasks.length === 0 ? (
                            <div style={{ padding: '14px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-medium)', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                              <span>No tasks in this event yet. </span>
                              <button
                                type="button"
                                className="btn-link"
                                style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                onClick={() => onOpenNewTaskForEvent && onOpenNewTaskForEvent(task.id, isRecurringEvent)}
                              >
                                + Add Task
                              </button>
                            </div>
                          ) : (
                            childTasks.map((sub) => {
                              const isSubRec = Boolean(sub.recurrence && sub.recurrence !== 'none');
                              const isSubDone = isSubRec
                                ? Boolean(sub.completedDates?.includes(recurringDate))
                                : sub.status === 'completed';

                              const hasSubSteps = Boolean((sub.hasSteps || (Array.isArray(sub.steps) && sub.steps.length > 0)) && Array.isArray(sub.steps) && sub.steps.length > 0);
                              const subStepsCompletedCount = hasSubSteps
                                ? (isSubRec
                                    ? (sub.completedStepsByDate?.[recurringDate]?.length || 0)
                                    : sub.steps.filter((s) => s.completed).length)
                                : 0;
                              const subStepsTotalCount = hasSubSteps ? sub.steps.length : 0;
                              const subStepsPct = subStepsTotalCount > 0 ? Math.round((subStepsCompletedCount / subStepsTotalCount) * 100) : 0;
                              const isSubStepsOpen = activeStepsTaskId === sub.id;

                              return (
                                <div 
                                  key={sub.id}
                                  className={`event-table-subtask-item ${isSubStepsOpen ? 'has-floating-menu-open' : ''}`}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px',
                                    padding: '8px 12px',
                                    background: 'var(--bg-surface)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-subtle)',
                                    position: 'relative',
                                    zIndex: isSubStepsOpen ? 45 : 1
                                  }}
                                >
                                  {/* Left: Checkbox, Title & Compact Steps Dropdown (SAME AS NORMAL/RECURRING TASKS) */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                                    <div 
                                      className={`custom-checkbox ${isSubDone ? 'checked' : ''}`}
                                      onClick={() => {
                                        if (isSubRec) {
                                          toggleRecurringDateComplete(sub.id, recurringDate);
                                        } else {
                                          toggleTaskComplete(sub.id);
                                        }
                                      }}
                                      title={isSubDone ? "Mark as Incomplete" : "Mark as Completed"}
                                      style={{ flexShrink: 0 }}
                                    >
                                      {isSubDone && <Check size={12} />}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexWrap: 'wrap' }}>
                                      {isSubRec ? <Repeat size={12} color="#6366f1" /> : <Check size={12} color="var(--text-muted)" />}
                                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: isSubDone ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: isSubDone ? 'line-through' : 'none' }}>
                                        {sub.title}
                                      </span>
                                    </div>

                                    {/* Multi-Step Checklist for Table View (SAME AS NORMAL/RECURRING TASKS) */}
                                    {hasSubSteps && (
                                      <div className={`table-steps-container ${isSubStepsOpen ? 'menu-open' : ''}`} style={{ margin: 0 }}>
                                        <button
                                          type="button"
                                          className="table-steps-toggle-btn"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveStepsTaskId((prev) => (prev === sub.id ? null : sub.id));
                                          }}
                                          title={isSubStepsOpen ? "Close subtasks menu" : "Click to view subtasks"}
                                        >
                                          <ListChecks size={12} color="var(--primary)" />
                                          <span>{subStepsCompletedCount}/{subStepsTotalCount} steps ({subStepsPct}%)</span>
                                          {isSubStepsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                        </button>

                                        {/* Floating Menu Popover */}
                                        {isSubStepsOpen && (
                                          <div 
                                            className="table-steps-floating-menu"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <div className="card-steps-floating-header">
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <ListChecks size={13} color="var(--primary)" />
                                                <span className="card-steps-floating-title">Subtasks</span>
                                                <span className={`card-steps-pill ${subStepsPct === 100 ? 'done' : ''}`}>
                                                  {subStepsCompletedCount}/{subStepsTotalCount} ({subStepsPct}%)
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
                                              {sub.steps.map((step, idx) => {
                                                const isStepDone = isSubRec
                                                  ? Boolean(sub.completedStepsByDate?.[recurringDate]?.includes(step.id))
                                                  : Boolean(step.completed);

                                                return (
                                                  <div
                                                    key={step.id || idx}
                                                    className={`card-step-row ${isStepDone ? 'completed' : ''}`}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (isSubRec) {
                                                        toggleTaskStep(sub.id, step.id, recurringDate);
                                                      } else {
                                                        toggleTaskStep(sub.id, step.id);
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
                                    )}
                                  </div>

                                  {/* Right: Badges & Actions */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                    <span className={`badge badge-${sub.priority}`} style={{ textTransform: 'capitalize', fontSize: '0.625rem' }}>
                                      {sub.priority}
                                    </span>

                                    {sub.dueDate && (
                                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                        Due: {sub.dueDate}
                                      </span>
                                    )}

                                    {sub.assignedTo && (
                                      <div className="assignee-chip" style={{ fontSize: '0.6875rem', padding: '1px 5px' }}>
                                        <span>{sub.assignedTo.name}</span>
                                      </div>
                                    )}

                                    <button 
                                      type="button"
                                      className="btn-icon" 
                                      style={{ width: '24px', height: '24px', color: 'var(--primary)' }} 
                                      onClick={() => setMoveTargetTask(sub)}
                                      title="Change or remove from Event"
                                    >
                                      <FolderOutput size={12} />
                                    </button>

                                    <button 
                                      type="button"
                                      className="btn-icon" 
                                      style={{ width: '24px', height: '24px' }} 
                                      onClick={() => onEditTask(sub)}
                                      title="Edit Task"
                                    >
                                      <Edit3 size={12} />
                                    </button>

                                    <button 
                                      type="button" 
                                      className="btn-icon" 
                                      style={{ width: '24px', height: '24px', color: 'var(--priority-urgent)' }} 
                                      onClick={() => deleteTask(sub.id)}
                                      title="Delete Task"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}

                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', alignSelf: 'flex-start', gap: '4px' }}
                            onClick={() => onOpenNewTaskForEvent && onOpenNewTaskForEvent(task.id, isRecurringEvent)}
                          >
                            <Plus size={12} />
                            <span>Add Task to this Event</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            }

            // Case 2: Standalone Task Row
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
                          title={`Part of Event: ${parentEvent.title}`}
                        >
                          <Calendar size={9} />
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
                  {Boolean((task.hasSteps || (Array.isArray(task.steps) && task.steps.length > 0)) && Array.isArray(task.steps) && task.steps.length > 0) && (() => {
                    const completedStepsCount = isRecurring
                      ? (task.completedStepsByDate?.[recurringDate]?.length || 0)
                      : task.steps.filter((s) => s.completed).length;
                    const totalStepsCount = task.steps.length;
                    const isStepsOpen = activeStepsTaskId === task.id;
                    const percentage = Math.round((completedStepsCount / totalStepsCount) * 100);

                    return (
                      <div className={`table-steps-container ${isStepsOpen ? 'menu-open' : ''}`}>
                        <button
                          type="button"
                          className="table-steps-toggle-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveStepsTaskId((prev) => (prev === task.id ? null : task.id));
                          }}
                          title={isStepsOpen ? "Close subtasks menu" : "Click to view subtasks"}
                        >
                          <ListChecks size={12} color="var(--primary)" />
                          <span>{completedStepsCount}/{totalStepsCount} steps ({percentage}%)</span>
                          {isStepsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>

                        {/* Floating Menu Popover */}
                        {isStepsOpen && (
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

                {/* Status */}
                <td>
                  {isCompleted ? (
                    <span className="badge badge-completed">
                      <Check size={11} />
                      <span>Done</span>
                    </span>
                  ) : isInProgress ? (
                    <span className="badge badge-in-progress">
                      <Clock size={11} />
                      <span>In Progress</span>
                    </span>
                  ) : (
                    <span className="badge badge-todo">
                      <span>To Do</span>
                    </span>
                  )}
                </td>

                {/* Priority */}
                <td>
                  <span 
                    className={`badge badge-${task.priority}`} 
                    onClick={(e) => handleCyclePriority(e, task)}
                    title="Click to change priority"
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {getPriorityIcon(task.priority)}
                    <span style={{ textTransform: 'capitalize' }}>{task.priority}</span>
                  </span>
                </td>

                {/* Due Date */}
                <td>
                  {dueInfo ? (
                    <span className={`date-badge ${dueInfo.class}`}>
                      {dueInfo.text}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                  )}
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
                      title={task.eventId ? "Change or remove from Event" : "Move into an Event"}
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

      {/* Delete Confirmation Modal for Task */}
      {deleteTargetTask && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteTargetTask(null)} style={{ zIndex: 9999 }}>
          <div 
            className="modal-dialog" 
            style={{ maxWidth: '400px', padding: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ padding: '0 0 12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--priority-urgent)' }}>
                <AlertCircle size={18} />
                <span style={{ fontWeight: 700 }}>Delete Task</span>
              </div>
              <button className="btn-icon" onClick={() => setDeleteTargetTask(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '16px 0' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text-main)' }}>"{deleteTargetTask.title}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer" style={{ padding: '12px 0 0 0', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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

      {/* Delete Confirmation Modal for Event */}
      {deleteTargetEvent && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteTargetEvent(null)} style={{ zIndex: 9999 }}>
          <div 
            className="modal-dialog" 
            style={{ maxWidth: '420px', padding: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ padding: '0 0 12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--priority-urgent)' }}>
                <AlertCircle size={18} />
                <span style={{ fontWeight: 700 }}>Delete Event</span>
              </div>
              <button className="btn-icon" onClick={() => setDeleteTargetEvent(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to delete the event <strong style={{ color: 'var(--text-main)' }}>"{deleteTargetEvent.title}"</strong>?
              </p>
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
                <span>Also delete all tasks inside this event</span>
              </label>
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
        </div>,
        document.body
      )}

      {/* Move Task to/from Event Modal */}
      <MoveTaskEventModal
        isOpen={Boolean(moveTargetTask)}
        onClose={() => setMoveTargetTask(null)}
        task={moveTargetTask}
        onOpenNewEvent={onOpenNewEvent || onOpenNewTask}
      />
    </div>
  );
};
