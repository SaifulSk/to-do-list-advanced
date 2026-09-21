import React, { useState, useEffect } from 'react';
import { X, Calendar, Flame, AlertTriangle, Clock, ArrowDown, Users, Tag, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useTasks } from '../../context/TaskContext';

export const TaskFormModal = ({ isOpen, onClose, initialTask, defaultDate }) => {
  const { addTask, updateTask } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  
  // Assigned to fields
  const [assignedName, setAssignedName] = useState('');
  const [assignedEmail, setAssignedEmail] = useState('');

  // Need help from fields
  const [hasHelper, setHasHelper] = useState(false);
  const [helperName, setHelperName] = useState('');
  const [helperTopic, setHelperTopic] = useState('');

  // Tags
  const [tagsInput, setTagsInput] = useState('');

  // Reset or populate fields on open
  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority || 'medium');
      setStatus(initialTask.status || 'todo');
      setDueDate(initialTask.dueDate ? initialTask.dueDate.split('T')[0] : '');
      setCreatedAt(initialTask.createdAt ? initialTask.createdAt.split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
      setAssignedName(initialTask.assignedTo?.name || '');
      setAssignedEmail(initialTask.assignedTo?.email || '');

      if (initialTask.needHelpFrom && initialTask.needHelpFrom.name) {
        setHasHelper(true);
        setHelperName(initialTask.needHelpFrom.name || '');
        setHelperTopic(initialTask.needHelpFrom.topic || '');
      } else {
        setHasHelper(false);
        setHelperName('');
        setHelperTopic('');
      }

      setTagsInput(initialTask.tags ? initialTask.tags.join(', ') : '');
    } else {
      // New task default state
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setDueDate(defaultDate || format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'));
      setAssignedName('');
      setAssignedEmail('');
      setHasHelper(false);
      setHelperName('');
      setHelperTopic('');
      setTagsInput('');
    }
  }, [initialTask, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const taskPayload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      dueDate: dueDate || null,
      createdAt: createdAt || format(new Date(), 'yyyy-MM-dd'),
      assignedTo: assignedName.trim()
        ? {
            name: assignedName.trim(),
            email: assignedEmail.trim() || undefined,
            avatar: assignedName.trim().slice(0, 2).toUpperCase()
          }
        : null,
      needHelpFrom: hasHelper && helperName.trim()
        ? {
            name: helperName.trim(),
            topic: helperTopic.trim() || undefined
          }
        : null,
      tags
    };

    if (initialTask) {
      await updateTask(initialTask.id, taskPayload);
    } else {
      await addTask(taskPayload);
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <CheckSquare size={18} color="var(--primary)" />
            <span>{initialTask ? 'Edit Task' : 'Create New Task'}</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label className="form-label">
                <span>Task Title *</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Design responsive calendar component"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                <span>Description / Notes</span>
              </label>
              <textarea
                className="textarea"
                placeholder="Provide details, scope, or acceptance criteria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Priority & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="urgent">🔥 Urgent</option>
                  <option value="high">⚠️ High</option>
                  <option value="medium">⏱️ Medium</option>
                  <option value="low">⬇️ Low</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Dates: Due Date and Created Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">
                  <span>Due Date</span>
                </label>
                <input
                  type="date"
                  className="input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Creation Date</span>
                </label>
                <input
                  type="date"
                  className="input"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                />
              </div>
            </div>

            {/* Section: Assigned To */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Users size={15} color="var(--assignee-accent)" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Assigned To
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Assignee Name (e.g. Sarah Chen)"
                  value={assignedName}
                  onChange={(e) => setAssignedName(e.target.value)}
                />
                <input
                  type="email"
                  className="input"
                  placeholder="Assignee Email (optional)"
                  value={assignedEmail}
                  onChange={(e) => setAssignedEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Section: Need Help From (Collaborator request) */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={15} color="var(--help-accent)" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Need Help From (Collaborator)
                  </span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={hasHelper}
                    onChange={(e) => setHasHelper(e.target.checked)}
                  />
                  <span>Request Help</span>
                </label>
              </div>

              {hasHelper && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--help-accent-bg)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--help-border)' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Helper Name (e.g. Elena Rostova, Marcus Bell)"
                    value={helperName}
                    onChange={(e) => setHelperName(e.target.value)}
                    required={hasHelper}
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="Topic or Reason (e.g. Code Review, Architecture advice)"
                    value={helperTopic}
                    onChange={(e) => setHelperTopic(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="form-group">
              <label className="form-label">
                <span>Tags</span>
                <span className="form-hint">Comma separated</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="Design, Frontend, Firebase, Urgent"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <span>{initialTask ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
