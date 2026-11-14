import React from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Calendar, 
  FolderInput, 
  FolderOutput, 
  Check, 
  Plus,
  AlertCircle,
  Repeat
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

export const MoveTaskEventModal = ({ isOpen, onClose, task, onOpenNewEvent }) => {
  const { eventTasks, updateTask } = useTasks();

  if (!isOpen || !task) return null;

  const currentEvent = task.eventId ? eventTasks?.find((e) => e.id === task.eventId) : null;
  const isTaskRecurring = Boolean(task.recurrence && task.recurrence !== 'none');

  // Find compatible events: matching recurrence or all events
  const otherEvents = (eventTasks || []).filter((e) => e.id !== task.eventId);

  const handleMoveTo = (targetEventId) => {
    updateTask(task.id, { eventId: targetEventId || null });
    onClose();
  };

  const modalJSX = (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-dialog" 
        style={{ maxWidth: '440px', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--primary)" />
            <span>Move Task to Event</span>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '16px 20px', gap: '14px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Task
            </span>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 0', wordBreak: 'break-word' }}>
              {task.title}
            </h4>
          </div>

          {/* Current Event Affiliation / Remove from Event Option */}
          {task.eventId && currentEvent ? (
            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Currently in: <strong style={{ color: currentEvent.color || 'var(--primary)' }}>🗓️ {currentEvent.title}</strong>
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center',
                  padding: '8px 14px',
                  fontSize: '0.8125rem',
                  color: 'var(--priority-urgent)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                  background: 'rgba(239, 68, 68, 0.05)'
                }}
                onClick={() => handleMoveTo(null)}
              >
                <FolderOutput size={15} />
                <span>Remove from Event (Make Standalone)</span>
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Currently: <strong>Standalone Task</strong> (not assigned to any event)
            </div>
          )}

          {/* Destination Event Selection */}
          <div>
            <label className="form-label" style={{ marginBottom: '8px', fontWeight: 700 }}>
              {task.eventId ? 'Or Move to Another Event:' : 'Choose Destination Event:'}
            </label>

            {(!eventTasks || eventTasks.length === 0) ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-medium)', color: 'var(--text-muted)' }}>
                <AlertCircle size={22} style={{ margin: '0 auto 6px', opacity: 0.6 }} />
                <p style={{ fontSize: '0.8125rem', margin: 0 }}>
                  No events created yet.
                </p>
                {onOpenNewEvent && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: '10px', fontSize: '0.75rem', padding: '6px 14px' }}
                    onClick={() => {
                      onClose();
                      onOpenNewEvent();
                    }}
                  >
                    <Plus size={14} />
                    <span>Create New Event</span>
                  </button>
                )}
              </div>
            ) : otherEvents.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                No other events available.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {otherEvents.map((evt) => (
                  <button
                    key={evt.id}
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      textAlign: 'left',
                      width: '100%',
                      borderLeft: `4px solid ${evt.color || '#6366f1'}`
                    }}
                    onClick={() => handleMoveTo(evt.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <Calendar size={16} style={{ color: evt.color || '#6366f1', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                          {evt.title}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {evt.eventType === 'recurring' ? 'Recurring Event' : 'Normal Event'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                      <span>Move</span>
                      <FolderInput size={13} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null;
};
