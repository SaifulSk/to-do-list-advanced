import React from 'react';
import { X, Calendar, Plus, Clock, Flame, AlertTriangle, ArrowDown, Users, Check, Repeat, Banknote } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const CalendarDayModal = ({ isOpen, onClose, selectedDate, tasksForDay, onAddTaskForDate, onEditTask }) => {
  if (!isOpen || !selectedDate) return null;

  const formattedDate = format(selectedDate, 'EEEE, MMMM d, yyyy');
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const createdTasks = tasksForDay.filter((item) => item.type === 'created');
  const dueTasks = tasksForDay.filter((item) => item.type === 'due');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Calendar size={18} color="var(--primary)" />
            <span>{formattedDate}</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Quick Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Tasks schedule & timeline for this day
            </span>
            <button 
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
              onClick={() => {
                onClose();
                onAddTaskForDate(dateStr);
              }}
            >
              <Plus size={14} />
              <span>Add Task on this Date</span>
            </button>
          </div>

          {/* Due On This Day */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div className="legend-dot due" />
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--marker-due)' }}>
                Due on this day ({dueTasks.length})
              </h4>
            </div>

            {dueTasks.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '16px' }}>
                No tasks due on this date.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dueTasks.map(({ task }) => (
                  <div 
                    key={`due-${task.id}`}
                    className={`task-card priority-${task.priority} ${task.status === 'completed' ? 'completed' : ''}`}
                    style={{ padding: '10px 14px', cursor: 'pointer' }}
                    onClick={() => {
                      onClose();
                      onEditTask(task);
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>{task.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {task.recurrence && task.recurrence !== 'none' && (
                            <span className="badge badge-recurrence" style={{ fontSize: '0.6875rem' }}>
                              <Repeat size={10} />
                              <span>{task.recurrence}</span>
                            </span>
                          )}
                          {task.amount !== undefined && task.amount !== null && task.amount !== '' && (
                            <span className="badge badge-amount" style={{ fontSize: '0.6875rem' }}>
                              <Banknote size={10} />
                              <span>{task.currency || '₹'}{Number(task.amount).toLocaleString()}</span>
                            </span>
                          )}
                          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        {task.assignedTo && (
                          <span>Assignee: <strong>{task.assignedTo.name}</strong></span>
                        )}
                        {task.needHelpFrom && (
                          <span style={{ color: 'var(--help-accent)' }}>
                            🤝 Needs help from {task.needHelpFrom.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Created On This Day */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div className="legend-dot created" />
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--marker-created)' }}>
                Created on this day ({createdTasks.length})
              </h4>
            </div>

            {createdTasks.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '16px' }}>
                No tasks were created on this date.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {createdTasks.map(({ task }) => (
                  <div 
                    key={`created-${task.id}`}
                    className={`task-card priority-${task.priority}`}
                    style={{ padding: '10px 14px', cursor: 'pointer' }}
                    onClick={() => {
                      onClose();
                      onEditTask(task);
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>{task.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {task.recurrence && task.recurrence !== 'none' && (
                            <span className="badge badge-recurrence" style={{ fontSize: '0.6875rem' }}>
                              <Repeat size={10} />
                              <span>{task.recurrence}</span>
                            </span>
                          )}
                          {task.amount !== undefined && task.amount !== null && task.amount !== '' && (
                            <span className="badge badge-amount" style={{ fontSize: '0.6875rem' }}>
                              <Banknote size={10} />
                              <span>{task.currency || '₹'}{Number(task.amount).toLocaleString()}</span>
                            </span>
                          )}
                          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        {task.dueDate && <span>Target Due: {task.dueDate}</span>}
                        {task.assignedTo && <span>Owner: {task.assignedTo.name}</span>}
                      </div>
                    </div>
                  </div>
                ))}
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
    </div>
  );
};
