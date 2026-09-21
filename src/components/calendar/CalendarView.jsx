import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isToday,
  isSameDay,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { CalendarDayModal } from './CalendarDayModal';

export const CalendarView = ({ onOpenNewTask, onEditTask }) => {
  const { tasks } = useTasks();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [calendarFilter, setCalendarFilter] = useState('all'); // 'all' | 'due' | 'created'

  // Generate calendar grid dates for currentMonth view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Map tasks to dates for quick lookup
  const tasksByDateMap = useMemo(() => {
    const map = {};

    tasks.forEach((task) => {
      // 1. Task Created Date
      if (task.createdAt) {
        const createdKey = task.createdAt.split('T')[0];
        if (!map[createdKey]) map[createdKey] = [];
        map[createdKey].push({ type: 'created', task });
      }

      // 2. Task Due Date
      if (task.dueDate) {
        const dueKey = task.dueDate.split('T')[0];
        if (!map[dueKey]) map[dueKey] = [];
        map[dueKey].push({ type: 'due', task });
      }
    });

    return map;
  }, [tasks]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setIsDayModalOpen(true);
  };

  const selectedDayKey = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null;
  const selectedDayItems = selectedDayKey ? (tasksByDateMap[selectedDayKey] || []) : [];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-container">
      {/* Calendar Header */}
      <div className="calendar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 className="calendar-month-title">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>

          <div className="calendar-nav-group">
            <button className="btn-icon" onClick={handlePrevMonth} title="Previous Month">
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8125rem' }} onClick={handleToday}>
              Today
            </button>
            <button className="btn-icon" onClick={handleNextMonth} title="Next Month">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Legend & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Legend */}
          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot created" />
              <span>Created Date</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot due" />
              <span>Due Date</span>
            </div>
          </div>

          {/* Perspective Filter */}
          <div className="view-tabs" style={{ background: 'var(--bg-surface-elevated)' }}>
            <button 
              className={`view-tab-btn ${calendarFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCalendarFilter('all')}
            >
              All Events
            </button>
            <button 
              className={`view-tab-btn ${calendarFilter === 'due' ? 'active' : ''}`}
              onClick={() => setCalendarFilter('due')}
            >
              Due Only
            </button>
            <button 
              className={`view-tab-btn ${calendarFilter === 'created' ? 'active' : ''}`}
              onClick={() => setCalendarFilter('created')}
            >
              Created Only
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="calendar-grid">
        {weekdays.map((day) => (
          <div key={day} className="calendar-weekday-header">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="calendar-grid">
        {calendarDays.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayItems = tasksByDateMap[dayKey] || [];

          // Filter by perspective
          const visibleItems = dayItems.filter((item) => {
            if (calendarFilter === 'due') return item.type === 'due';
            if (calendarFilter === 'created') return item.type === 'created';
            return true;
          });

          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={dayKey}
              className={`calendar-day-cell ${!isCurrentMonth ? 'other-month' : ''} ${isCurrentDay ? 'is-today' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <span className="calendar-day-number">
                {format(day, 'd')}
              </span>

              {/* Day Events Pills */}
              <div className="calendar-events-wrap">
                {visibleItems.slice(0, 3).map((item, idx) => (
                  <div
                    key={`${item.type}-${item.task.id}-${idx}`}
                    className={`calendar-event-pill ${item.type} ${item.task.status === 'completed' ? 'completed' : ''}`}
                    title={`${item.type === 'due' ? 'Deadline' : 'Created'}: ${item.task.title}`}
                  >
                    <span>{item.type === 'due' ? '🟠 Due:' : '🔵'}</span>
                    <span>{item.task.title}</span>
                  </div>
                ))}

                {visibleItems.length > 3 && (
                  <span className="calendar-more-count">
                    +{visibleItems.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Details Modal */}
      <CalendarDayModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        selectedDate={selectedDay}
        tasksForDay={selectedDayItems}
        onAddTaskForDate={(dateStr) => onOpenNewTask(dateStr)}
        onEditTask={onEditTask}
      />
    </div>
  );
};
