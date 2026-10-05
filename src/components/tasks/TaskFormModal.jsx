import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar, 
  Flame, 
  AlertTriangle, 
  Clock, 
  ArrowDown, 
  Users, 
  CheckSquare, 
  Settings, 
  Repeat, 
  Banknote, 
  CheckCircle2, 
  ListChecks, 
  Plus, 
  Trash2, 
  Check 
} from 'lucide-react';
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

  // Multiple Steps / Subtasks state
  const [hasSteps, setHasSteps] = useState(false);
  const [steps, setSteps] = useState([]);
  const [newStepText, setNewStepText] = useState('');

  // Assigned to field
  const [assignedName, setAssignedName] = useState('');
  const [isCustomAssignee, setIsCustomAssignee] = useState(false);

  // Need help from fields
  const [hasHelper, setHasHelper] = useState(false);
  const [helperName, setHelperName] = useState('');
  const [helperTopic, setHelperTopic] = useState('');

  // Tags
  const [tagsInput, setTagsInput] = useState('');

  // Track previous open state and task id to prevent wiping form data when assignees update
  const prevIsOpenRef = React.useRef(false);
  const prevTaskIdRef = React.useRef(null);

  // Reset or populate fields only when modal is newly opened or task changes
  useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;
    const isTaskChanged = initialTask?.id !== prevTaskIdRef.current;

    if (isOpening || isTaskChanged) {
      if (initialTask) {
        setTitle(initialTask.title || '');
        setDescription(initialTask.description || '');
        setPriority(initialTask.priority || 'medium');
        setDueDate(initialTask.dueDate ? initialTask.dueDate.split('T')[0] : '');
        setRecurrence(initialTask.recurrence || 'none');
        setAmount(initialTask.amount !== undefined && initialTask.amount !== null ? String(initialTask.amount) : '');
        
        // Steps initialization
        setHasSteps(Boolean(initialTask.hasSteps && Array.isArray(initialTask.steps) && initialTask.steps.length > 0));
        setSteps(Array.isArray(initialTask.steps) ? initialTask.steps : []);
        setNewStepText('');

        const currentAssigned = initialTask.assignedTo?.name || '';
        setAssignedName(currentAssigned);
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
        // New task default state
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate(defaultDate || '');
        setRecurrence('none');
        setAmount('');
        setHasSteps(false);
        setSteps([]);
        setNewStepText('');
        setAssignedName('');
        setIsCustomAssignee(false);
        setHasHelper(false);
        setHelperName('');
        setHelperTopic('');
        setTagsInput('');
      }
    }

    prevIsOpenRef.current = isOpen;
    prevTaskIdRef.current = initialTask?.id || null;
  }, [isOpen, initialTask, defaultDate]);

  if (!isOpen) return null;

  // Add a new step to list
  const handleAddStep = (e) => {
    if (e) e.preventDefault();
    if (!newStepText.trim()) return;
    const newStep = {
      id: 'step-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: newStepText.trim(),
      completed: false
    };
    setSteps((prev) => [...prev, newStep]);
    setNewStepText('');
  };

  // Remove a step
  const handleRemoveStep = (stepId) => {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
  };

  // Toggle step completion inside modal
  const handleToggleStepModal = (stepId) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Sanitize steps
    const cleanedSteps = hasSteps
      ? steps
          .filter((s) => s.title && s.title.trim())
          .map((s) => ({
            id: s.id || ('step-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
            title: s.title.trim(),
            completed: Boolean(s.completed)
          }))
      : [];

    const finalHasSteps = Boolean(hasSteps && cleanedSteps.length > 0);

    // Automatic status resolution:
    // If multi-stepped task:
    // - 0 steps done -> 'todo' (or initialTask status if not completed)
    // - >= 1 step done but not all -> 'in_progress'
    // - all steps done -> 'completed'
    let finalStatus = initialTask?.status || 'todo';
    let finalCompletedAt = initialTask?.completedAt || null;

    if (finalHasSteps) {
      const completedCount = cleanedSteps.filter((s) => s.completed).length;
      if (completedCount === cleanedSteps.length && cleanedSteps.length > 0) {
        finalStatus = 'completed';
        finalCompletedAt = finalCompletedAt || format(new Date(), 'yyyy-MM-dd HH:mm');
      } else if (completedCount > 0) {
        finalStatus = 'in_progress';
        finalCompletedAt = null;
      } else {
        if (finalStatus === 'in_progress' || finalStatus === 'completed') {
          finalStatus = 'todo';
        }
        finalCompletedAt = null;
      }
    }

    const taskPayload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status: finalStatus,
      completedAt: finalCompletedAt,
      hasSteps: finalHasSteps,
      steps: cleanedSteps,
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
            {/* Completed Date Banner if already completed */}
            {initialTask?.completedAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-border)', marginBottom: '8px' }}>
                <CheckCircle2 size={14} />
                <span>Task Completed on: {initialTask.completedAt}</span>
              </div>
            )}

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

            {/* Multiple Steps / Subtasks Section */}
            <div className="form-steps-section">
              <div className="form-steps-toggle-header">
                <div className="form-steps-toggle-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ListChecks size={16} color="var(--primary)" />
                    <span className="form-steps-title">Multiple Steps / Subtasks</span>
                  </div>
                  <span className="form-steps-desc">Break this task into steps. Marking steps done auto-updates status to In Progress.</span>
                </div>
                <label className="switch-toggle" title="Toggle Multiple Steps for this Task">
                  <input 
                    type="checkbox" 
                    checked={hasSteps} 
                    onChange={(e) => setHasSteps(e.target.checked)} 
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              {hasSteps && (
                <div className="form-steps-body">
                  {/* Input to add a new step */}
                  <div className="form-step-add-row">
                    <input
                      type="text"
                      className="input"
                      placeholder="Add a step (e.g. Gather references, Draft wireframe)..."
                      value={newStepText}
                      onChange={(e) => setNewStepText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddStep();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleAddStep}
                      disabled={!newStepText.trim()}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                    >
                      <Plus size={14} />
                      <span>Add Step</span>
                    </button>
                  </div>

                  {/* Steps List */}
                  {steps.length > 0 ? (
                    <div className="form-steps-list">
                      {steps.map((step, index) => (
                        <div key={step.id} className={`form-step-item ${step.completed ? 'completed' : ''}`}>
                          <div 
                            className={`custom-checkbox ${step.completed ? 'checked' : ''}`}
                            onClick={() => handleToggleStepModal(step.id)}
                            title={step.completed ? "Mark step as incomplete" : "Mark step as complete"}
                            style={{ width: '18px', height: '18px', marginTop: 0 }}
                          >
                            {step.completed && <Check size={11} />}
                          </div>
                          <span className="form-step-index">{index + 1}.</span>
                          <span className="form-step-text">{step.title}</span>
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ width: '24px', height: '24px', color: 'var(--text-muted)' }}
                            onClick={() => handleRemoveStep(step.id)}
                            title="Remove step"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      <div className="form-steps-summary">
                        <span>
                          {steps.filter(s => s.completed).length} of {steps.length} steps completed
                          {steps.filter(s => s.completed).length > 0 && steps.filter(s => s.completed).length < steps.length && (
                            <strong style={{ color: 'var(--primary)', marginLeft: '6px' }}>&bull; Auto-sets to In Progress</strong>
                          )}
                          {steps.length > 0 && steps.filter(s => s.completed).length === steps.length && (
                            <strong style={{ color: '#10b981', marginLeft: '6px' }}>&bull; All steps done (Completed)</strong>
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="form-steps-empty">
                      <span>No steps added yet. Type a step above and press Enter or click "Add Step".</span>
                    </div>
                  )}
                </div>
              )}
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
