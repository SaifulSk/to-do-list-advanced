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
  ChevronsDownUp,
  ChevronsUpDown,
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
    isTaskScheduledOnDate,
    deleteTask, 
    deleteEvent,
    updateTask,
    searchQuery,
    isFiltering,
    isTaskMatchingFilters,
    resetFilters
  } = useTasks();

  const [deleteTargetTask, setDeleteTargetTask] = useState(null);
  const [deleteTargetEvent, setDeleteTargetEvent] = useState(null);
  const [deleteSubtasksAlso, setDeleteSubtasksAlso] = useState(true);
  const [activeStepsTaskId, setActiveStepsTaskId] = useState(null);
  const [moveTargetTask, setMoveTargetTask] = useState(null);
  const [collapsedEventIds, setCollapsedEventIds] = useState(() => new Set());

  const tableEvents = useMemo(() => filteredTasks.filter((t) => t.isEvent), [filteredTasks]);
  const hasEvents = tableEvents.length > 0;
  const areAllEventsExpanded = hasEvents && tableEvents.every((e) => !collapsedEventIds.has(e.id));

  const toggleExpandCollapseAll = () => {
    if (areAllEventsExpanded) {
      setCollapsedEventIds(new Set(tableEvents.map((e) => e.id)));
    } else {
      setCollapsedEventIds((prev) => {
        const next = new Set(prev);
        tableEvents.forEach((e) => next.delete(e.id));
        return next;
      });
    }
  };

  const toggleEventExpand = (eventId) => {
    setCollapsedEventIds((prev) => {
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
            onClick={resetFilters}
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

  const colCount = (taskTypeTab === 'normal' || taskTypeTab === 'recurring') ? 7 : 8;

  return (
    <div className="task-table-container">
      <table className="task-table">
        <thead>
          <tr>
            <th style={{ width: '50px', textAlign: 'center' }}>
              {hasEvents ? (
                <button
                  type="button"
                  className="btn-icon"
                  style={{
                    width: '26px',
                    height: '26px',
                    margin: '0 auto',
                    color: areAllEventsExpanded ? 'var(--primary)' : 'var(--text-muted)'
                  }}
                  onClick={toggleExpandCollapseAll}
                  title={areAllEventsExpanded ? "Collapse All Events" : "Expand All Events"}
                  aria-label={areAllEventsExpanded ? "Collapse All Events" : "Expand All Events"}
                >
                  {areAllEventsExpanded ? <ChevronsDownUp size={15} /> : <ChevronsUpDown size={15} />}
                </button>
              ) : (
                <span>Done</span>
              )}
            </th>
            <th style={{ minWidth: '220px' }}>Task</th>
            <th style={{ width: '110px' }}>Status</th>
            <th style={{ width: '110px' }}>Priority</th>
            {taskTypeTab !== 'recurring' && <th style={{ width: '140px' }}>Due Date</th>}
            {taskTypeTab !== 'normal' && <th style={{ width: '110px' }}>Recurrence</th>}
            <th style={{ width: '110px' }}>Amount</th>
            <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((task) => {
            // Case 1: Event Task Row in Table View
            if (task.isEvent) {
              const isExpanded = !collapsedEventIds.has(task.id);
              const accentColor = task.color || '#6366f1';
              const isRecurringEvent = task.eventType === 'recurring' || Boolean(task.recurrence && task.recurrence !== 'none');
              const allChildTasks = tasks.filter((t) => t.eventId === task.id);
              const scheduledChildTasks = isRecurringEvent
                ? allChildTasks.filter((t) => {
                    if (t.recurrence && t.recurrence !== 'none') {
                      return isTaskScheduledOnDate ? isTaskScheduledOnDate(t, recurringDate) : true;
                    }
                    return true;
                  })
                : allChildTasks;
              const totalCount = scheduledChildTasks.length;
              const completedCount = scheduledChildTasks.filter((t) => {
                if (isRecurringEvent || (t.recurrence && t.recurrence !== 'none')) {
                  return Array.isArray(t.completedDates) && t.completedDates.includes(recurringDate);
                }
                return t.status === 'completed';
              }).length;
              const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              const isAllDone = totalCount > 0 && completedCount === totalCount;

              // Filter subtasks taskwise based on active filters
              const childTasks = scheduledChildTasks.filter((sub) => 
                isTaskMatchingFilters ? isTaskMatchingFilters(sub, task) : true
              );

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
                          <Calendar size={13} />
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                          {task.title}
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

                    {/* Priority - Blank for event row */}
                    <td></td>

                    {/* Due Date - Blank for event row */}
                    {taskTypeTab !== 'recurring' && <td></td>}

                    {/* Recurrence - Blank for event row */}
                    {taskTypeTab !== 'normal' && <td></td>}

                    {/* Amount - Blank for event row */}
                    <td></td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '0.6875rem', gap: '3px' }}
                          onClick={() => onOpenNewTaskForEvent && onOpenNewTaskForEvent(task.id, isRecurringEvent)}
                          title="Add Task to this Event"
                        >
                          <Plus size={11} />
                          <span>Add Task</span>
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

                  {/* Expanded Subtasks: Rendered as table rows matching the dynamic columns */}
                  {isExpanded && (
                    childTasks.length === 0 ? (
                      <tr className="event-table-empty-row" style={{ background: 'var(--bg-app)' }}>
                        <td colSpan={colCount} style={{ padding: '14px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', borderBottom: '1px solid var(--border-subtle)' }}>
                          <span>{isRecurringEvent ? 'No matching tasks scheduled for this day in this event.' : 'No matching tasks in this event.'}</span>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {childTasks.map((sub) => {
                          const isSubRec = Boolean(sub.recurrence && sub.recurrence !== 'none');
                          const isSubDone = isSubRec
                            ? Boolean(sub.completedDates?.includes(recurringDate))
                            : sub.status === 'completed';
                          const subRecurringDoneSteps = isSubRec && sub.hasSteps && Array.isArray(sub.steps)
                            ? (sub.completedStepsByDate?.[recurringDate]?.length || 0)
                            : 0;
                          const isSubInProgress = isSubRec
                            ? (!isSubDone && subRecurringDoneSteps > 0)
                            : sub.status === 'in_progress';
                          const subDueInfo = getDueDateDisplay(sub.dueDate, isSubDone);

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
                            <tr 
                              key={sub.id} 
                              className={`event-subtask-row ${isSubDone ? 'completed' : ''} ${isSubStepsOpen ? 'has-floating-menu-open' : ''}`}
                              style={{ background: 'var(--bg-app)', borderLeft: `4px solid ${accentColor}44` }}
                            >
                              {/* 1. Done Checkbox */}
                              <td style={{ textAlign: 'center' }}>
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
                                  style={{ margin: '0 auto' }}
                                >
                                  {isSubDone && <Check size={14} />}
                                </div>
                              </td>

                              {/* 2. Task Title, Description & Step Menu */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span className="table-task-title">{sub.title}</span>
                                </div>
                                {sub.description && (
                                  <div className="table-task-desc" title={sub.description}>
                                    {sub.description}
                                  </div>
                                )}

                                {/* Multi-Step Checklist for Table View */}
                                {hasSubSteps && (
                                  <div className={`table-steps-container ${isSubStepsOpen ? 'menu-open' : ''}`} style={{ marginLeft: '14px' }}>
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
                              </td>

                              {/* 3. Status Badge */}
                              <td>
                                {isSubDone ? (
                                  <span className="badge badge-completed">
                                    <Check size={11} />
                                    <span>Done</span>
                                  </span>
                                ) : isSubInProgress ? (
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

                              {/* 4. Priority Badge (Under Priority Column) */}
                              <td>
                                <span 
                                  className={`badge badge-${sub.priority}`} 
                                  onClick={(e) => handleCyclePriority(e, sub)}
                                  title="Click to change priority"
                                  style={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                  {getPriorityIcon(sub.priority)}
                                  <span style={{ textTransform: 'capitalize' }}>{sub.priority}</span>
                                </span>
                              </td>

                              {/* 5. Due Date (hidden in Recurring tab) */}
                              {taskTypeTab !== 'recurring' && (
                                <td>
                                  {subDueInfo ? (
                                    <span className={`date-badge ${subDueInfo.class}`}>
                                      {subDueInfo.text}
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                                  )}
                                </td>
                              )}

                              {/* 6. Recurrence (hidden in Normal tab) */}
                              {taskTypeTab !== 'normal' && (
                                <td>
                                  {sub.recurrence && sub.recurrence !== 'none' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                                      <span className="badge badge-recurrence">
                                        <Repeat size={11} />
                                        <span>{getRecurrenceLabel(sub)}</span>
                                      </span>
                                      {sub.isRecurringStopped && (
                                        <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--priority-urgent)', borderColor: 'rgba(239, 68, 68, 0.25)', fontSize: '0.625rem', padding: '1px 5px' }}>
                                          ⏸ Stopped
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                                  )}
                                </td>
                              )}

                              {/* 7. Amount (Under Amount Column) */}
                              <td>
                                {sub.amount !== undefined && sub.amount !== null && sub.amount !== '' ? (
                                  <span className="badge badge-amount">
                                    <Banknote size={12} />
                                    <span>{sub.currency || '₹'}{Number(sub.amount).toLocaleString()}</span>
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                                )}
                              </td>

                              {/* Actions (Under Actions Column) */}
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                  <button 
                                    type="button"
                                    className="btn-icon" 
                                    style={{ width: '26px', height: '26px', color: 'var(--primary)' }} 
                                    onClick={() => setMoveTargetTask(sub)}
                                    title="Change or remove from Event"
                                  >
                                    <FolderOutput size={13} />
                                  </button>

                                  <button 
                                    type="button"
                                    className="btn-icon" 
                                    style={{ width: '26px', height: '26px' }} 
                                    onClick={() => onEditTask(sub)}
                                    title="Edit Task"
                                  >
                                    <Edit3 size={13} />
                                  </button>

                                  <button 
                                    type="button" 
                                    className="btn-icon" 
                                    style={{ width: '26px', height: '26px', color: 'var(--priority-urgent)' }} 
                                    onClick={() => deleteTask(sub.id)}
                                    title="Delete Task"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    )
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

                {/* Due Date (hidden in Recurring tab) */}
                {taskTypeTab !== 'recurring' && (
                  <td>
                    {dueInfo ? (
                      <span className={`date-badge ${dueInfo.class}`}>
                        {dueInfo.text}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
                )}

                {/* Recurrence (hidden in Normal tab) */}
                {taskTypeTab !== 'normal' && (
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
                )}

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
