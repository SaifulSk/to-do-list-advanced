import React, { useState } from 'react';
import { 
  FolderKanban, 
  FolderPlus, 
  Plus, 
  Calendar, 
  Clock, 
  Flame, 
  AlertTriangle, 
  ArrowDown, 
  Users, 
  Banknote, 
  Check, 
  Repeat, 
  CheckCircle2, 
  ListChecks, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  CheckSquare, 
  PlayCircle, 
  PauseCircle, 
  X, 
  AlertCircle 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTasks } from '../../context/TaskContext';

export const EventTasksView = ({ 
  onEditEvent, 
  onOpenNewEvent, 
  onOpenNewTaskForEvent, 
  onEditTask 
}) => {
  const { 
    filteredTasks, 
    tasks, 
    eventTasks, 
    deleteTask, 
    deleteEvent, 
    toggleTaskComplete, 
    toggleRecurringDateComplete, 
    toggleStopRecurrence, 
    toggleTaskStep, 
    getRecurrenceLabel, 
    recurringDate, 
    searchQuery, 
    filterPriority, 
    filterStatus 
  } = useTasks();

  // Expanded folders state (default expands all for easy view)
  const [expandedEventIds, setExpandedEventIds] = useState(() => {
    return new Set(eventTasks.map((e) => e.id));
  });

  // Per-event subtask filter ('all' | 'normal' | 'recurring' | 'active' | 'completed')
  const [eventSubFilters, setEventSubFilters] = useState({});

  // Active steps floating popover: `${eventId}-${taskId}`
  const [activeStepsKey, setActiveStepsKey] = useState(null);

  // Delete event confirmation state
  const [deleteTargetEvent, setDeleteTargetEvent] = useState(null);
  const [deleteSubtasksAlso, setDeleteSubtasksAlso] = useState(true);

  // Toggle expanding an event folder
  const toggleExpand = (eventId) => {
    setExpandedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const getSubFilter = (eventId) => eventSubFilters[eventId] || 'all';

  const setSubFilter = (eventId, filter) => {
    setEventSubFilters((prev) => ({ ...prev, [eventId]: filter }));
  };

  // Close floating steps popover on click outside
  React.useEffect(() => {
    if (!activeStepsKey) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.card-steps-section')) {
        setActiveStepsKey(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeStepsKey]);

  // Overall empty state (no events exist at all)
  if (eventTasks.length === 0) {
    return (
      <div className="empty-state glass-panel" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <div 
          className="empty-state-icon" 
          style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}
        >
          <FolderKanban size={34} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
            No Event Tasks Yet
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 16px', lineHeight: 1.5 }}>
            Event tasks act like <strong>folders containing multiple tasks</strong>. You can organize major projects, trips, or launches with both <strong>normal tasks</strong> and <strong>recurring tasks</strong> together in one place.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button className="btn btn-primary" onClick={onOpenNewEvent} style={{ padding: '8px 18px' }}>
            <FolderPlus size={16} />
            <span>Create Your First Event</span>
          </button>
        </div>
      </div>
    );
  }

  // Filtered empty state (search/priority filters returned 0 events)
  if (filteredTasks.length === 0) {
    return (
      <div className="empty-state glass-panel" style={{ padding: '36px 20px', textAlign: 'center' }}>
        <div className="empty-state-icon">
          <AlertCircle size={32} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
            No matching event tasks found
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Try adjusting your search query, priority, or status filters.
          </p>
        </div>
        <button 
          className="btn btn-secondary" 
          style={{ marginTop: '12px' }}
          onClick={onOpenNewEvent}
        >
          <FolderPlus size={15} />
          <span>Create New Event</span>
        </button>
      </div>
    );
  }

  return (
    <div className="event-tasks-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Action Header Bar */}
      <div 
        className="event-view-header-bar"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '10px',
          padding: '6px 2px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {filteredTasks.length} {filteredTasks.length === 1 ? 'Event Folder' : 'Event Folders'}
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            • Grouping normal & recurring tasks
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            type="button" 
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
            onClick={() => {
              if (expandedEventIds.size === filteredTasks.length) {
                setExpandedEventIds(new Set());
              } else {
                setExpandedEventIds(new Set(filteredTasks.map((e) => e.id)));
              }
            }}
          >
            {expandedEventIds.size === filteredTasks.length ? 'Collapse All' : 'Expand All'}
          </button>

          <button 
            type="button" 
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
            onClick={onOpenNewEvent}
          >
            <FolderPlus size={15} />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Event Folders List */}
      <div className="event-folders-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredTasks.map((event) => {
          const isExpanded = expandedEventIds.has(event.id);
          const accentColor = event.color || '#6366f1';

          // All child tasks belonging to this event
          const allChildTasks = tasks.filter((t) => t.eventId === event.id);
          const normalChildTasks = allChildTasks.filter((t) => !t.recurrence || t.recurrence === 'none');
          const recurringChildTasks = allChildTasks.filter((t) => t.recurrence && t.recurrence !== 'none');

          // Completion calculations
          const completedNormal = normalChildTasks.filter((t) => t.status === 'completed').length;
          const completedRecurring = recurringChildTasks.filter((t) => 
            Array.isArray(t.completedDates) && t.completedDates.includes(recurringDate)
          ).length;
          const totalCompleted = completedNormal + completedRecurring;
          const totalSubtasks = allChildTasks.length;
          const percentage = totalSubtasks > 0 ? Math.round((totalCompleted / totalSubtasks) * 100) : 0;
          const isEventDone = totalSubtasks > 0 && totalCompleted === totalSubtasks;

          // Date display helper
          const dateRangeText = (() => {
            if (event.startDate && event.endDate) {
              return `${format(parseISO(event.startDate), 'MMM d, yyyy')} – ${format(parseISO(event.endDate), 'MMM d, yyyy')}`;
            }
            if (event.startDate) return `Starts: ${format(parseISO(event.startDate), 'MMM d, yyyy')}`;
            if (event.endDate || event.dueDate) return `Target: ${format(parseISO(event.endDate || event.dueDate), 'MMM d, yyyy')}`;
            return null;
          })();

          // Filter subtasks by sub-filter pill
          const currentSubFilter = getSubFilter(event.id);
          const displayedSubtasks = allChildTasks.filter((sub) => {
            const isRecurring = Boolean(sub.recurrence && sub.recurrence !== 'none');
            const isDone = isRecurring
              ? Boolean(sub.completedDates?.includes(recurringDate))
              : sub.status === 'completed';

            if (currentSubFilter === 'normal') return !isRecurring;
            if (currentSubFilter === 'recurring') return isRecurring;
            if (currentSubFilter === 'active') return !isDone;
            if (currentSubFilter === 'completed') return isDone;
            return true;
          });

          return (
            <div 
              key={event.id}
              className={`event-folder-card ${isExpanded ? 'expanded' : ''}`}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                transition: 'all var(--transition-fast)',
                borderLeft: `5px solid ${accentColor}`
              }}
            >
              {/* Event Folder Header */}
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
                  background: isExpanded ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                  transition: 'background var(--transition-fast)'
                }}
                onClick={() => toggleExpand(event.id)}
              >
                {/* Left: Folder Icon & Event Meta */}
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
                    <FolderKanban size={20} />
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

                      {isEventDone && (
                        <span className="badge badge-completed" style={{ fontSize: '0.6875rem' }}>
                          <CheckCircle2 size={11} />
                          <span>All Done</span>
                        </span>
                      )}

                      <span className={`badge badge-${event.priority}`} style={{ textTransform: 'capitalize', fontSize: '0.6875rem' }}>
                        {event.priority}
                      </span>
                    </div>

                    {event.description && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                        {event.description}
                      </p>
                    )}

                    {/* Metadata Chips: Dates, Budget, Assignee */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      {dateRangeText && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} color="var(--primary)" />
                          <span>{dateRangeText}</span>
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
                    style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}
                    onClick={() => onOpenNewTaskForEvent(event.id, false)}
                    title="Add Normal Task to this Event"
                  >
                    <Plus size={13} />
                    <span className="event-action-text">Add Task</span>
                  </button>

                  {/* Edit Event */}
                  <button 
                    type="button" 
                    className="btn-icon" 
                    style={{ width: '30px', height: '30px' }}
                    onClick={() => onEditEvent(event)}
                    title="Edit Event Folder"
                  >
                    <Edit3 size={14} />
                  </button>

                  {/* Delete Event */}
                  <button 
                    type="button" 
                    className="btn-icon" 
                    style={{ width: '30px', height: '30px', color: 'var(--priority-urgent)' }}
                    onClick={() => setDeleteTargetEvent(event)}
                    title="Delete Event Folder"
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Expand / Collapse Button */}
                  <button 
                    type="button" 
                    className="btn-icon" 
                    style={{ width: '30px', height: '30px' }}
                    onClick={() => toggleExpand(event.id)}
                    title={isExpanded ? "Collapse Folder" : "Expand Folder"}
                    aria-label={isExpanded ? "Collapse Folder" : "Expand Folder"}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Progress Bar & Subtask Breakdown */}
              <div 
                className="event-folder-progress-bar-wrap" 
                style={{ 
                  padding: '8px 18px 12px', 
                  borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
                  background: isExpanded ? 'var(--bg-surface-elevated)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {totalSubtasks === 0 ? 'No tasks yet' : `${totalCompleted} of ${totalSubtasks} tasks completed`}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      ({normalChildTasks.length} normal • {recurringChildTasks.length} recurring)
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

              {/* Expanded Folder Content (Child Tasks List) */}
              {isExpanded && (
                <div 
                  className="event-folder-body" 
                  style={{ 
                    padding: '16px 18px', 
                    background: 'var(--bg-app)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px' 
                  }}
                >
                  {/* Shelf Controls: Sub-filters + Add Buttons */}
                  <div 
                    className="event-subtasks-shelf"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      flexWrap: 'wrap', 
                      gap: '8px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid var(--border-subtle)'
                    }}
                  >
                    {/* Filter Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      <button 
                        type="button"
                        className={`badge ${currentSubFilter === 'all' ? 'badge-primary' : ''}`}
                        style={{ cursor: 'pointer', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid var(--border-subtle)', background: currentSubFilter === 'all' ? accentColor : 'var(--bg-surface)', color: currentSubFilter === 'all' ? '#ffffff' : 'var(--text-secondary)' }}
                        onClick={() => setSubFilter(event.id, 'all')}
                      >
                        All ({allChildTasks.length})
                      </button>

                      <button 
                        type="button"
                        className="badge"
                        style={{ cursor: 'pointer', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid var(--border-subtle)', background: currentSubFilter === 'normal' ? accentColor : 'var(--bg-surface)', color: currentSubFilter === 'normal' ? '#ffffff' : 'var(--text-secondary)' }}
                        onClick={() => setSubFilter(event.id, 'normal')}
                      >
                        Normal ({normalChildTasks.length})
                      </button>

                      <button 
                        type="button"
                        className="badge"
                        style={{ cursor: 'pointer', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid var(--border-subtle)', background: currentSubFilter === 'recurring' ? accentColor : 'var(--bg-surface)', color: currentSubFilter === 'recurring' ? '#ffffff' : 'var(--text-secondary)' }}
                        onClick={() => setSubFilter(event.id, 'recurring')}
                      >
                        Recurring ({recurringChildTasks.length})
                      </button>

                      <button 
                        type="button"
                        className="badge"
                        style={{ cursor: 'pointer', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid var(--border-subtle)', background: currentSubFilter === 'active' ? accentColor : 'var(--bg-surface)', color: currentSubFilter === 'active' ? '#ffffff' : 'var(--text-secondary)' }}
                        onClick={() => setSubFilter(event.id, 'active')}
                      >
                        Active ({totalSubtasks - totalCompleted})
                      </button>

                      <button 
                        type="button"
                        className="badge"
                        style={{ cursor: 'pointer', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid var(--border-subtle)', background: currentSubFilter === 'completed' ? accentColor : 'var(--bg-surface)', color: currentSubFilter === 'completed' ? '#ffffff' : 'var(--text-secondary)' }}
                        onClick={() => setSubFilter(event.id, 'completed')}
                      >
                        Done ({totalCompleted})
                      </button>
                    </div>

                    {/* Quick Add Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                        onClick={() => onOpenNewTaskForEvent(event.id, false)}
                        title="Add a Normal Task to this event folder"
                      >
                        <CheckSquare size={13} />
                        <span>+ Normal Task</span>
                      </button>

                      <button 
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                        onClick={() => onOpenNewTaskForEvent(event.id, true)}
                        title="Add a Recurring Task to this event folder"
                      >
                        <Repeat size={13} />
                        <span>+ Recurring Task</span>
                      </button>
                    </div>
                  </div>

                  {/* Subtasks List */}
                  {displayedSubtasks.length === 0 ? (
                    <div 
                      style={{ 
                        padding: '24px 16px', 
                        textAlign: 'center', 
                        background: 'var(--bg-surface)', 
                        borderRadius: 'var(--radius-md)', 
                        border: '1px dashed var(--border-medium)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      <p style={{ fontSize: '0.8125rem', margin: '0 0 10px' }}>
                        {allChildTasks.length === 0 
                          ? 'This event folder is empty. Add your first normal or recurring task above.'
                          : 'No tasks match the selected filter.'}
                      </p>
                      {allChildTasks.length === 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button 
                            type="button" 
                            className="btn btn-primary"
                            style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                            onClick={() => onOpenNewTaskForEvent(event.id, false)}
                          >
                            <Plus size={13} />
                            <span>Add Normal Task</span>
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-secondary"
                            style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                            onClick={() => onOpenNewTaskForEvent(event.id, true)}
                          >
                            <Repeat size={13} />
                            <span>Add Recurring Task</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {displayedSubtasks.map((task) => {
                        const isRecurring = Boolean(task.recurrence && task.recurrence !== 'none');
                        const isCompleted = isRecurring
                          ? Boolean(task.completedDates?.includes(recurringDate))
                          : task.status === 'completed';

                        const stepKey = `${event.id}-${task.id}`;
                        const isStepsOpen = activeStepsKey === stepKey;

                        return (
                          <div 
                            key={task.id}
                            className={`task-card priority-${task.priority} ${isCompleted ? 'completed' : ''} ${isStepsOpen ? 'has-floating-menu-open' : ''}`}
                            style={{ 
                              padding: '10px 14px', 
                              cursor: 'default',
                              background: 'var(--bg-surface)',
                              borderRadius: 'var(--radius-md)'
                            }}
                          >
                            {/* Checkbox */}
                            <div 
                              className={`custom-checkbox ${isCompleted ? 'checked' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isRecurring) {
                                  toggleRecurringDateComplete(task.id, recurringDate);
                                } else {
                                  toggleTaskComplete(task.id);
                                }
                              }}
                              title={isCompleted ? "Mark as Incomplete" : "Mark as Completed"}
                              style={{ marginTop: '2px', flexShrink: 0 }}
                            >
                              {isCompleted && <Check size={14} />}
                            </div>

                            {/* Task Content */}
                            <div className="task-content" style={{ flex: 1, minWidth: 0 }}>
                              <div className="task-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}>
                                  {isRecurring ? (
                                    <span title="Recurring Task" style={{ color: '#6366f1', display: 'flex', alignItems: 'center' }}>
                                      <Repeat size={14} />
                                    </span>
                                  ) : (
                                    <span title="Normal Task" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                      <CheckSquare size={14} />
                                    </span>
                                  )}
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
                                    {task.title}
                                  </h4>
                                </div>

                                {/* Actions Toolbar */}
                                <div className="task-actions" style={{ gap: '4px', flexShrink: 0 }}>
                                  {isRecurring && (
                                    <button
                                      type="button"
                                      className={`btn-stop-recurrence ${task.isRecurringStopped ? 'resume' : 'stop'}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleStopRecurrence(task.id);
                                      }}
                                      title={task.isRecurringStopped ? "Resume recurring schedule" : "Stop recurrence for this task"}
                                    >
                                      {task.isRecurringStopped ? <PlayCircle size={11} /> : <PauseCircle size={11} />}
                                      <span>{task.isRecurringStopped ? 'Resume' : 'Stop'}</span>
                                    </button>
                                  )}

                                  <button 
                                    type="button"
                                    className="btn-icon" 
                                    style={{ width: '26px', height: '26px' }} 
                                    onClick={() => onEditTask(task)}
                                    title="Edit Task"
                                  >
                                    <Edit3 size={13} />
                                  </button>

                                  <button 
                                    type="button"
                                    className="btn-icon" 
                                    style={{ width: '26px', height: '26px', color: 'var(--priority-urgent)' }} 
                                    onClick={() => deleteTask(task.id)}
                                    title="Delete Task"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>

                              {task.description && (
                                <p className="task-desc" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                                  {task.description}
                                </p>
                              )}

                              {/* Multi-step subtasks with interactive popover & reordering */}
                              {task.hasSteps && Array.isArray(task.steps) && task.steps.length > 0 && (() => {
                                const completedCount = isRecurring
                                  ? (task.completedStepsByDate?.[recurringDate]?.length || 0)
                                  : task.steps.filter((s) => s.completed).length;
                                const totalCount = task.steps.length;
                                const stepPct = Math.round((completedCount / totalCount) * 100);

                                return (
                                  <div 
                                    className={`card-steps-section ${isStepsOpen ? 'menu-open' : ''}`}
                                    style={{ marginTop: '6px' }}
                                  >
                                    <div 
                                      className="card-steps-header" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveStepsKey(isStepsOpen ? null : stepKey);
                                      }}
                                      title={isStepsOpen ? "Close subtasks menu" : "Click to view subtasks"}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <ListChecks size={13} color="var(--primary)" />
                                        <span className="card-steps-label">
                                          Steps ({completedCount}/{totalCount})
                                        </span>
                                        <span className={`card-steps-pill ${stepPct === 100 ? 'done' : ''}`}>
                                          {stepPct}%
                                        </span>
                                      </div>
                                      <button 
                                        type="button" 
                                        className="btn-icon" 
                                        style={{ width: '20px', height: '20px', padding: 0 }}
                                        aria-label={isStepsOpen ? "Close subtasks menu" : "Open subtasks menu"}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveStepsKey(isStepsOpen ? null : stepKey);
                                        }}
                                      >
                                        {isStepsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                      </button>
                                    </div>

                                    <div className="card-steps-bar-track">
                                      <div 
                                        className="card-steps-bar-fill" 
                                        style={{ 
                                          width: `${stepPct}%`,
                                          background: stepPct === 100 ? '#10b981' : 'var(--primary)' 
                                        }} 
                                      />
                                    </div>

                                    {isStepsOpen && (
                                      <div 
                                        className="card-steps-floating-menu"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="card-steps-floating-header">
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ListChecks size={13} color="var(--primary)" />
                                            <span className="card-steps-floating-title">Subtasks</span>
                                            <span className={`card-steps-pill ${stepPct === 100 ? 'done' : ''}`}>
                                              {completedCount}/{totalCount} ({stepPct}%)
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            className="btn-icon card-steps-floating-close"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveStepsKey(null);
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

                              {/* Task Badges & Metadata */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                {isRecurring && (
                                  <span className="badge badge-recurrence" style={{ fontSize: '0.6875rem' }}>
                                    <Repeat size={10} />
                                    <span>{getRecurrenceLabel(task)}</span>
                                  </span>
                                )}

                                {!isRecurring && task.dueDate && (
                                  <span style={{ fontSize: '0.75rem' }}>
                                    Due: {task.dueDate}
                                  </span>
                                )}

                                {task.amount !== undefined && task.amount !== null && task.amount !== '' && (
                                  <span className="badge badge-amount" style={{ fontSize: '0.6875rem' }}>
                                    <Banknote size={10} />
                                    <span>{task.currency || '₹'}{Number(task.amount).toLocaleString()}</span>
                                  </span>
                                )}

                                <span className={`badge badge-${task.priority}`} style={{ textTransform: 'capitalize', fontSize: '0.6875rem' }}>
                                  {task.priority}
                                </span>

                                {task.assignedTo && (
                                  <span style={{ fontSize: '0.75rem' }}>
                                    {task.assignedTo.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Event Confirmation Modal */}
      {deleteTargetEvent && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 1100 }} 
          onClick={() => setDeleteTargetEvent(null)}
        >
          <div 
            className="modal-dialog" 
            style={{ maxWidth: '440px' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--priority-urgent)' }}>
                <AlertTriangle size={18} />
                <span style={{ fontWeight: 700 }}>Delete Event Folder</span>
              </div>
              <button 
                type="button" 
                className="btn-icon" 
                onClick={() => setDeleteTargetEvent(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 20px', gap: '12px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to delete the event folder <strong style={{ color: 'var(--text-main)' }}>"{deleteTargetEvent.title}"</strong>?
              </p>

              {/* Subtasks option */}
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px 10px', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'var(--bg-surface-elevated)', 
                  cursor: 'pointer',
                  fontSize: '0.8125rem'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={deleteSubtasksAlso}
                  onChange={(e) => setDeleteSubtasksAlso(e.target.checked)}
                />
                <span>Also delete all subtasks inside this event folder</span>
              </label>

              {!deleteSubtasksAlso && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Subtasks will be preserved as standalone normal or recurring tasks.
                </p>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
