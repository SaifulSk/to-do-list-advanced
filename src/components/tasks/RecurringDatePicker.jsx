import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, addDays, subDays, isValid } from 'date-fns';
import { useTasks } from '../../context/TaskContext';

export const RecurringDatePicker = () => {
  const { recurringDate, setRecurringDate } = useTasks();

  const handlePrevDay = () => {
    try {
      const current = parseISO(recurringDate);
      if (isValid(current)) {
        setRecurringDate(format(subDays(current, 1), 'yyyy-MM-dd'));
      }
    } catch {
      setRecurringDate(format(new Date(), 'yyyy-MM-dd'));
    }
  };

  const handleNextDay = () => {
    try {
      const current = parseISO(recurringDate);
      if (isValid(current)) {
        setRecurringDate(format(addDays(current, 1), 'yyyy-MM-dd'));
      }
    } catch {
      setRecurringDate(format(new Date(), 'yyyy-MM-dd'));
    }
  };

  // Label strictly formatted as "Day, Date" (e.g. "Thursday, October 24, 2026")
  const dayDateLabel = (() => {
    try {
      const parsed = parseISO(recurringDate);
      if (isValid(parsed)) {
        return format(parsed, 'EEEE, MMMM d, yyyy');
      }
      return recurringDate;
    } catch {
      return recurringDate;
    }
  })();

  return (
    <div className="recurring-date-picker-bar">
      <button 
        type="button"
        className="btn-icon date-nav-arrow" 
        onClick={handlePrevDay}
        title="Previous Day"
        aria-label="Previous Day"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="recurring-date-picker-wrap" title="Click to pick a date">
        <Calendar size={18} color="var(--primary)" />
        <span className="recurring-date-display">{dayDateLabel}</span>
        {/* Invisible native date input overlay for one-click native calendar picker */}
        <input 
          type="date"
          className="recurring-native-date-input"
          value={recurringDate}
          onChange={(e) => {
            if (e.target.value) setRecurringDate(e.target.value);
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
    </div>
  );
};
