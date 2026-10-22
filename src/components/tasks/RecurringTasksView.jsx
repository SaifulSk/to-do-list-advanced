import React, { useState, useMemo } from 'react';
import { 
  Repeat, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Plus, 
  Edit3, 
  Trash2, 
  PauseCircle, 
  PlayCircle, 
  Search, 
  ListChecks, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Banknote,
  Users
} from 'lucide-react';
import { 
  format, 
  parseISO, 
  addDays, 
  subDays, 
  isToday, 
  isTomorrow, 
  isYesterday, 
  getDate, 
  getMonth, 
  isValid 
} from 'date-fns';
import { useTasks } from '../../context/TaskContext';

// Helper function to check if a recurring task is scheduled on a given date (yyyy-MM-dd)
export function isTaskScheduledOnDate(task, dateStr) {
  if (!task.recurrence || task.recurrence === 'none') return false;

  // 1. Creation date boundary: task appears on or after its creation date
  if (task.createdAt && dateStr < task.createdAt) {
    return false;
  }

  // 2. Stopped recurrence boundary: if stopped prior to dateStr, do not show
  if (task.isRecurringStopped) {
    if (task.recurrenceStoppedAt && dateStr > task.recurrenceStoppedAt) {
      return false;
    }
  }

  const targetDate = parseISO(dateStr);
  if (!isValid(targetDate)) return false;

  switch (task.recurrence) {
    case 'daily':
      // Daily tasks appear every day after creation
      return true;

    case 'weekly': {
      const targetDayName = format(targetDate, 'EEEE').toLowerCase();
      const taskDay = (task.recurringDayOfWeek || '').toLowerCase();
      if (taskDay) {
        return taskDay === targetDayName;
      }
      // Fallback: day of week from dueDate or createdAt
      const fallbackDate = task.dueDate ? parseISO(task.dueDate) : (task.createdAt ? parseISO(task.createdAt) : null);
      if (fallbackDate && isValid(fallbackDate)) {
        return format(fallbackDate, 'EEEE').toLowerCase() === targetDayName;
      }
      return false;
    }

    case 'monthly': {
      const targetDayOfMonth = getDate(targetDate);
      let taskDay = Number(task.recurringDayOfMonth);
      if (!taskDay || isNaN(taskDay)) {
        const fallbackDate = task.dueDate ? parseISO(task.dueDate) : (task.createdAt ? parseISO(task.createdAt) : null);
        if (fallbackDate && isValid(fallbackDate)) {
          taskDay = getDate(fallbackDate);
        }
      }
      return targetDayOfMonth === taskDay;
    }

    case 'yearly': {
      const targetMonth = getMonth(targetDate) + 1; // 1-12
      const targetDay = getDate(targetDate);
      let taskMonth = Number(task.recurringMonth);
      let taskDay = Number(task.recurringDayOfMonth);
      if (!taskMonth || !taskDay || isNaN(taskMonth) || isNaN(taskDay)) {
        const fallbackDate = task.dueDate ? parseISO(task.dueDate) : (task.createdAt ? parseISO(task.createdAt) : null);
        if (fallbackDate && isValid(fallbackDate)) {
          taskMonth = getMonth(fallbackDate) + 1;
          taskDay = getDate(fallbackDate);
        }
      }
      return targetMonth === taskMonth && targetDay === taskDay;
    }

    default:
      return false;
  }
}

export const RecurringTasksView = ({ onEditTask, onOpenNewTask }) => {
  const { 
    recurringTasks, 
    toggleRecurringDateComplete, 
    toggleStopRecurrence, 
    toggleTaskStep, 
    deleteTask 
  } = useTasks();

  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState('scheduled'); // 'scheduled' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSteps, setExpandedSteps] = useState({});
  const [deleteTargetTask, setDeleteTargetTask] = useState(null);

  // Date Navigation handlers
  const handlePrevDay = () => {
    try {
      const current = parseISO(selectedDate);
      setSelectedDate(format(subDays(current, 1), 'yyyy-MM-dd'));
    } catch {
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    }
  };

  const handleNextDay = () => {
    try {
      const current = parseISO(selectedDate);
      setSelectedDate(format(addDays(current, 1), 'yyyy-MM-dd'));
    } catch {
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    }
  };

  const handleJumpToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  // Filter tasks for selected date or all recurring
  const displayedTasks = useMemo(() => {
    let list = recurringTasks;

    if (viewMode === 'scheduled') {
      list = list.filter((task) => isTaskScheduledOnDate(task, selectedDate));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => 
        t.title?.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [recurringTasks, selectedDate, viewMode, searchQuery]);

  // Formatted date label
  const dateLabel = useMemo(() => {
    try {
      const parsed = parseISO(selectedDate);
      if (!isValid(parsed)) return selectedDate;
      if (isToday(parsed)) return `Today • ${format(parsed, 'EEEE, MMM d, yyyy')}`;
      if (isTomorrow(parsed)) return `Tomorrow • ${format(parsed, 'EEEE, MMM d, yyyy')}`;
      if (isYesterday(parsed)) return `Yesterday • ${format(parsed, 'EEEE, MMM d, yyyy')}`;
      return format(parsed, 'EEEE, MMMM d, yyyy');
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const activeCount = recurringTasks.filter(t => !t.isRecurringStopped).length;
  const stoppedCount = recurringTasks.filter(t => t.isRecurringStopped).length;

  return (
    <div className="recurring-view-container">
      {/* Date Navigation & Controls Header */}
      <div className="recurring-date-nav glass-panel">
        <div className="recurring-date-nav-left">
          <button 
            type="button"
            className="btn-icon date-nav-arrow" 
            onClick={handlePrevDay}
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="recurring-date-picker-wrap" title="Click to pick a specific date">
            <Calendar size={18} color="var(--primary)" />
            <span className="recurring-date-display">{dateLabel}</span>
            {/* Native Date Input overlaid seamlessly */}
            <input 
              type="date"
              className="recurring-native-date-input"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              title="Pick a date"
            />
          </div>

          <button 
            type="button"
            className="btn-icon date-nav-arrow" 
            onClick={handleNextDay}
            title="Next Day"
            aria-label="Next Day"
          >
            <ChevronRight size={18} />
          </button>

          {!isToday(parseISO(selectedDate)) && (
            <button 
              type="button"
              className="btn btn-secondary date-today-btn" 
              onClick={handleJumpToday}
            >
              Today
            </button>
          )}
        </div>

        {/* View Mode Switcher: Scheduled on Date vs All Rules */}
        <div className="recurring-mode-toggles">
          <button 
            type="button"
            className={`recurring-mode-btn ${viewMode === 'scheduled' ? 'active' : ''}`}
            onClick={() => setViewMode('scheduled')}
          >
            <span>On This Date</span>
            <span className="mode-badge">{recurringTasks.filter(t => isTaskScheduledOnDate(t, selectedDate)).length}</span>
          </button>
          <button 
            type="button"
            className={`recurring-mode-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            <span>All Recurring Rules</span>
            <span className="mode-badge">{recurringTasks.length}</span>
          </button>

          <button 
            type="button"
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.8125rem', gap: '6px' }}
            onClick={() => onOpenNewTask()}
          >
            <Plus size={15} />
            <span>New Recurring</span>
          </button>
        </div>
      </div>

      {/* Search & Status Bar */}
      <div className="recurring-subbar">
        <div className="recurring-search-wrap">
          <Search size={14} color="var(--text-muted)" />
          <input 
            type="text"
            className="recurring-search-input"
            placeholder="Search recurring tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="recurring-stats-pill">
          <span>Active: <strong>{activeCount}</strong></span>
          {stoppedCount > 0 && (
            <span style={{ color: 'var(--priority-urgent)' }}>&bull; Stopped: <strong>{stoppedCount}</strong></span>
          )}
        </div>
      </div>

      {/* Task List / Cards */}
      {displayedTasks.length === 0 ? (
        <div className="empty-state glass-panel">
          <div className="empty-state-icon">
            <Repeat size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {viewMode === 'scheduled' 
                ? 'No recurring tasks scheduled for this day' 
                : 'No recurring tasks found'}
            </h3>
            <p style={{ fontSize: '0.875rem', marginTop: '4px', maxWidth: '440px', margin: '4px auto 0 auto' }}>
              {viewMode === 'scheduled'
                ? `Daily tasks appear every day after creation. Weekly, monthly, and yearly tasks appear on their matching dates.`
                : `Create a repeating task to automate your daily, weekly, monthly, or yearly schedule.`}
            </p>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '10px' }}
            onClick={() => onOpenNewTask()}
          >
            <Plus size={16} />
            <span>Create Recurring Task</span>
          </button>
        </div>
      ) : (
        <div className="task-list">
          {displayedTasks.map((task) => {
            const isCompletedForDate = Array.isArray(task.completedDates) && task.completedDates.includes(selectedDate);
            const isStepsExpanded = Boolean(expandedSteps[task.id]);

            return (
              <div 
                key={task.id} 
                className={`task-card priority-${task.priority} ${isCompletedForDate ? 'completed' : ''}`}
                style={{ opacity: task.isRecurringStopped ? 0.75 : 1 }}
              >
                {/* Date-Specific Checkbox */}
                <div 
                  className={`custom-checkbox ${isCompletedForDate ? 'checked' : ''}`}
                  onClick={() => toggleRecurringDateComplete(task.id, selectedDate)}
                  title={isCompletedForDate ? `Mark incomplete for ${selectedDate}` : `Mark completed for ${selectedDate}`}
                >
                  {isCompletedForDate && <Check size={14} />}
                </div>

                {/* Content */}
                <div className="task-content">
                  <div className="task-header">
                    <h3 className="task-title" style={{ textDecoration: isCompletedForDate ? 'line-through' : 'none' }}>
                      {task.title}
                    </h3>

                    {/* Actions: Stop/Resume, Edit, Delete */}
                    <div className="task-actions" style={{ gap: '6px' }}>
                      {/* Stop / Resume Recurrence Action */}
                      <button
                        type="button"
                        className={`btn-stop-recurrence ${task.isRecurringStopped ? 'resume' : 'stop'}`}
                        onClick={() => toggleStopRecurrence(task.id)}
                        title={task.isRecurringStopped ? "Resume recurring schedule" : "Stop recurrence for this task"}
                      >
                        {task.isRecurringStopped ? <PlayCircle size={13} /> : <PauseCircle size={13} />}
                        <span>{task.isRecurringStopped ? 'Resume' : 'Stop'}</span>
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
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="task-desc">{task.description}</p>
                  )}

                  {/* Multi-step checklist (if task has steps) */}
                  {task.hasSteps && Array.isArray(task.steps) && task.steps.length > 0 && (() => {
                    const completedCount = task.steps.filter((s) => s.completed).length;
                    const totalCount = task.steps.length;
                    const percentage = Math.round((completedCount / totalCount) * 100);

                    return (
                      <div className="card-steps-section">
                        <div 
                          className="card-steps-header" 
                          onClick={() => setExpandedSteps(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
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
                          >
                            {isStepsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
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

                        {/* Steps List */}
                        {isStepsExpanded && (
                          <div className="card-steps-list">
                            {task.steps.map((step, idx) => (
                              <div 
                                key={step.id || idx} 
                                className={`card-step-row ${step.completed ? 'completed' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskStep(task.id, step.id);
                                }}
                              >
                                <div className={`custom-checkbox card-step-checkbox ${step.completed ? 'checked' : ''}`}>
                                  {step.completed && <Check size={10} />}
                                </div>
                                <span className="card-step-text">{step.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Metadata Row: Recurrence Pattern, Status, Completion Status for Date */}
                  <div className="task-metadata" style={{ marginTop: '4px' }}>
                    {/* Recurrence Rule Badge */}
                    <span className="badge badge-recurrence" style={{ fontSize: '0.75rem', gap: '5px' }}>
                      <Repeat size={12} />
                      {task.recurrence === 'daily' && <span>Daily (Every day)</span>}
                      {task.recurrence === 'weekly' && (
                        <span>Weekly on {task.recurringDayOfWeek ? task.recurringDayOfWeek.charAt(0).toUpperCase() + task.recurringDayOfWeek.slice(1) : 'Scheduled Day'}</span>
                      )}
                      {task.recurrence === 'monthly' && (
                        <span>Monthly on day {task.recurringDayOfMonth || 1}</span>
                      )}
                      {task.recurrence === 'yearly' && (
                        <span>Yearly on Month {task.recurringMonth || 1}, Day {task.recurringDayOfMonth || 1}</span>
                      )}
                    </span>

                    {/* Recurrence Status: Active vs Stopped */}
                    {task.isRecurringStopped ? (
                      <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--priority-urgent)', borderColor: 'rgba(239, 68, 68, 0.25)', fontSize: '0.6875rem' }}>
                        ⏸ Stopped
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.25)', fontSize: '0.6875rem' }}>
                        ✓ Active
                      </span>
                    )}

                    {/* Completion for Date */}
                    {isCompletedForDate ? (
                      <span className="badge badge-completed" style={{ fontSize: '0.6875rem' }}>
                        <Check size={11} />
                        <span>Completed on this date</span>
                      </span>
                    ) : (
                      <span className="badge badge-todo" style={{ fontSize: '0.6875rem' }}>
                        <span>Pending for this date</span>
                      </span>
                    )}

                    {/* Amount */}
                    {task.amount !== undefined && task.amount !== null && task.amount !== '' && (
                      <span className="badge badge-amount">
                        <Banknote size={11} />
                        <span>{task.currency || '₹'}{Number(task.amount).toLocaleString()}</span>
                      </span>
                    )}

                    {/* Assignee */}
                    {task.assignedTo && (
                      <span className="badge badge-assignee">
                        <Users size={11} />
                        <span>{task.assignedTo.name}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetTask && (
        <div className="modal-overlay" onClick={() => setDeleteTargetTask(null)}>
          <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: 'var(--priority-urgent)' }}>
                <AlertCircle size={18} />
                <span>Delete Recurring Task</span>
              </div>
            </div>
            <div className="modal-body" style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                Are you sure you want to delete <strong>"{deleteTargetTask.title}"</strong>?
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                This will remove the recurring task and all its scheduled occurrences.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTargetTask(null)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ background: 'var(--priority-urgent)', borderColor: 'var(--priority-urgent)' }}
                onClick={() => {
                  deleteTask(deleteTargetTask.id);
                  setDeleteTargetTask(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
