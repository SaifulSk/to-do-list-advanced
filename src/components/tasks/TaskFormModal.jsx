import React, { useState, useEffect } from 'react';
import { X, Calendar, Flame, AlertTriangle, Clock, ArrowDown, Users, CheckSquare, Settings, Repeat, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { useTasks } from '../../context/TaskContext';

export const TaskFormModal = ({ isOpen, onClose, initialTask, defaultDate, onOpenAssigneeMaster }) => {
  const { addTask, updateTask, assignees } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  
  // Recurrence & Amount fields
  const [recurrence, setRecurrence] = useState('none');
  const [amount, setAmount] = useState('');

  // Assigned to field
  const [assignedName, setAssignedName] = useState('');
  const [isCustomAssignee, setIsCustomAssignee] = useState(false);

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
      setDueDate(initialTask.dueDate ? initialTask.dueDate.split('T')[0] : '');
      setRecurrence(initialTask.recurrence || 'none');
      setAmount(initialTask.amount !== undefined && initialTask.amount !== null ? String(initialTask.amount) : '');
      const currentAssigned = initialTask.assignedTo?.name || '';
      setAssignedName(currentAssigned);
      // Check if current assignee is in master
      const inMaster = assignees.some(a => a.name.toLowerCase() === currentAssigned.toLowerCase());
      setIsCustomAssignee(Boolean(currentAssigned && !inMaster));

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
      // New task default state (Creation date is automatically today, due date is optional, status defaults to 'todo')
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(defaultDate || '');
      setRecurrence('none');
      setAmount('');
      setAssignedName('');
      setIsCustomAssignee(false);
      setHasHelper(false);
      setHelperName('');
      setHelperTopic('');
      setTagsInput('');
    }
  }, [initialTask, defaultDate, isOpen, assignees]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
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
      status: initialTask?.status || 'todo', // Status defaults to 'todo' on creation
      dueDate: dueDate ? dueDate : null, // Optional
      createdAt: initialTask?.createdAt || format(new Date(), 'yyyy-MM-dd'), // Current date
      recurrence: recurrence !== 'none' ? recurrence : null,
      amount: amount !== '' && !isNaN(Number(amount)) ? Number(amount) : null,
      currency: amount !== '' ? '₹' : null,
      assignedTo: assignedName.trim()
        ? {
            name: assignedName.trim(),
            avatar: assignedName.trim().slice(0, 2).toUpperCase()
          }
        : null,
      needHelpFrom: hasHelper && helperName.trim()
        ? {
            name: helperName.trim(),
            topic: helperTopic.trim() || '' // Never pass undefined to Firestore
          }
        : null,
      tags
    };

    // 1. Immediately close the modal so UI is snappy and never gets stuck
    onClose();

    // 2. Perform optimistic update / add
    if (initialTask && initialTask.id) {
      updateTask(initialTask.id, taskPayload);
    } else {
      addTask(taskPayload);
    }
  };

  const handleAssigneeSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomAssignee(true);
      setAssignedName('');
    } else {
      setIsCustomAssignee(false);
      setAssignedName(val);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <CheckSquare size={18} color="var(--primary)" />
            <span>{initialTask ? 'Edit Task' : 'Create New Task'}</span>
          </div>
          <button className="btn-icon" onClick={onClose} type="button">
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
                placeholder="e.g. Design user dashboard interface"
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

            {/* Priority and Due Date side by side (Status removed from modal) */}
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

              {/* Due Date in place of Status */}
              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <span>Due Date (Optional)</span>
                  </label>
                  {dueDate && (
                    <button
                      type="button"
                      onClick={() => setDueDate('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  className="input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Recurrence & Amount side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              {/* Recurrence / Regular Task */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-start' }}>
                  <Repeat size={14} color="var(--primary)" />
                  <span>Repeat (Regular / Recurring)</span>
                </label>
                <select
                  className="select"
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">🔁 Daily (Every day)</option>
                  <option value="weekly">🔁 Weekly (Every week)</option>
                  <option value="monthly">🔁 Monthly (Every month)</option>
                  <option value="yearly">🔁 Yearly (Every year)</option>
                </select>
              </div>

              {/* Amount / Budget (Optional) */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-start' }}>
                  <Banknote size={14} color="var(--primary)" />
                  <span>Amount / Cost (Optional)</span>
                </label>
                <div className="input-with-symbol">
                  <span className="input-symbol">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="input input-with-symbol-field"
                    placeholder="e.g. 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section: Assigned To with Master Selector */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={15} color="var(--assignee-accent)" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Assigned To
                  </span>
                </div>
                {onOpenAssigneeMaster && (
                  <button
                    type="button"
                    onClick={onOpenAssigneeMaster}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Settings size={12} />
                    <span>Manage Master</span>
                  </button>
                )}
              </div>

              {/* Dropdown with Assignee Master + Custom option */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <select
                  className="select"
                  value={isCustomAssignee ? '__custom__' : assignedName}
                  onChange={handleAssigneeSelectChange}
                >
                  <option value="">-- Unassigned --</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name} {a.role ? `(${a.role})` : ''}
                    </option>
                  ))}
                  <option value="__custom__">✏️ Enter custom name...</option>
                </select>

                {isCustomAssignee && (
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter assignee name..."
                    value={assignedName}
                    onChange={(e) => setAssignedName(e.target.value)}
                    autoFocus
                  />
                )}
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
                    placeholder="Helper Name (e.g. Marcus Bell)"
                    value={helperName}
                    onChange={(e) => setHelperName(e.target.value)}
                    required={hasHelper}
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="Topic or Reason (e.g. Code Review, Testing)"
                    value={helperTopic}
                    onChange={(e) => setHelperTopic(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label">
                  <span>Tags</span>
                </label>
                <span className="form-hint">Comma separated</span>
              </div>
              <input
                type="text"
                className="input"
                placeholder="Design, Frontend, Urgent"
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
