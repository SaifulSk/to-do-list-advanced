import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  FolderKanban, 
  Calendar, 
  Flame, 
  AlertTriangle, 
  Clock, 
  ArrowDown, 
  Users, 
  Banknote, 
  Palette, 
  Tag, 
  Check, 
  Plus 
} from 'lucide-react';
import { format } from 'date-fns';
import { useTasks } from '../../context/TaskContext';

const COLOR_PRESETS = [
  { id: 'indigo', label: 'Indigo', value: '#6366f1' },
  { id: 'emerald', label: 'Emerald', value: '#10b981' },
  { id: 'amber', label: 'Amber', value: '#f59e0b' },
  { id: 'rose', label: 'Rose', value: '#f43f5e' },
  { id: 'violet', label: 'Violet', value: '#8b5cf6' },
  { id: 'sky', label: 'Sky Blue', value: '#0ea5e9' }
];

export const EventFormModal = ({ isOpen, onClose, initialEvent, onOpenAssigneeMaster }) => {
  const { addTask, updateTask, assignees } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [amount, setAmount] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [assignedName, setAssignedName] = useState('');
  const [isCustomAssignee, setIsCustomAssignee] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  const prevIsOpenRef = useRef(false);
  const prevEventIdRef = useRef(null);

  useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;
    const isEventChanged = initialEvent?.id !== prevEventIdRef.current;

    if (isOpening || isEventChanged) {
      if (initialEvent) {
        setTitle(initialEvent.title || '');
        setDescription(initialEvent.description || '');
        setStartDate(initialEvent.startDate || '');
        setEndDate(initialEvent.endDate || initialEvent.dueDate || '');
        setPriority(initialEvent.priority || 'medium');
        setAmount(initialEvent.amount !== undefined && initialEvent.amount !== null ? String(initialEvent.amount) : '');
        setSelectedColor(initialEvent.color || '#6366f1');
        setAssignedName(initialEvent.assignedTo?.name || '');
        setIsCustomAssignee(Boolean(initialEvent.assignedTo?.name && !assignees.some(a => a.name === initialEvent.assignedTo.name)));
        setTagsInput(Array.isArray(initialEvent.tags) ? initialEvent.tags.join(', ') : '');
      } else {
        setTitle('');
        setDescription('');
        const today = format(new Date(), 'yyyy-MM-dd');
        setStartDate(today);
        setEndDate('');
        setPriority('medium');
        setAmount('');
        setSelectedColor('#6366f1');
        setAssignedName('');
        setIsCustomAssignee(false);
        setTagsInput('');
      }
    }

    prevIsOpenRef.current = isOpen;
    prevEventIdRef.current = initialEvent?.id || null;
  }, [isOpen, initialEvent, assignees]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const eventPayload = {
      isEvent: true,
      title: title.trim(),
      description: description.trim(),
      startDate: startDate || null,
      endDate: endDate || null,
      dueDate: endDate || startDate || null,
      priority,
      status: initialEvent?.status || 'todo',
      color: selectedColor || '#6366f1',
      amount: amount !== '' && !isNaN(Number(amount)) ? Number(amount) : null,
      currency: amount !== '' ? '₹' : null,
      assignedTo: assignedName.trim()
        ? {
            name: assignedName.trim(),
            avatar: assignedName.trim().slice(0, 2).toUpperCase()
          }
        : null,
      tags
    };

    onClose();

    if (initialEvent && initialEvent.id) {
      updateTask(initialEvent.id, eventPayload);
    } else {
      addTask(eventPayload);
    }
  };

  const modalJSX = (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-dialog" 
        style={{ maxWidth: '580px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: '8px', 
                background: `${selectedColor}20`, 
                color: selectedColor, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <FolderKanban size={16} />
            </div>
            <span>{initialEvent ? 'Edit Event Task' : 'Create New Event Task'}</span>
          </div>
          <button className="btn-icon" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto', gap: '14px', padding: '16px 20px' }}>
            
            {/* Event Name */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Event / Folder Name <span style={{ color: 'var(--priority-urgent)' }}>*</span>
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Sister's Wedding, Tech Conference 2026, Website Redesign..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description / Event Notes</label>
              <textarea 
                className="form-input" 
                placeholder="Key goals, location, venue details, or overview for this event folder..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Date Range: Start Date & End Date */}
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} color="var(--primary)" />
                  <span>Start Date</span>
                </label>
                <input 
                  type="date" 
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} color="var(--primary)" />
                  <span>End / Target Date</span>
                </label>
                <input 
                  type="date" 
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Priority & Budget */}
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {/* Priority */}
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select 
                  className="form-input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Priority</option>
                </select>
              </div>

              {/* Estimated Budget / Amount */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Banknote size={13} color="var(--primary)" />
                  <span>Total Budget (Optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>₹</span>
                  <input 
                    type="number"
                    min="0"
                    step="any"
                    className="form-input" 
                    placeholder="e.g. 50000"
                    style={{ paddingLeft: '26px' }}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Event Lead / Assignee */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={13} color="var(--primary)" />
                  <span>Event Lead / Organizer (Optional)</span>
                </label>
                {onOpenAssigneeMaster && (
                  <button 
                    type="button" 
                    className="btn-link"
                    style={{ fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                    onClick={onOpenAssigneeMaster}
                  >
                    Manage Team
                  </button>
                )}
              </div>

              {!isCustomAssignee ? (
                <select 
                  className="form-input"
                  value={assignedName}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomAssignee(true);
                      setAssignedName('');
                    } else {
                      setAssignedName(e.target.value);
                    }
                  }}
                >
                  <option value="">Unassigned (None)</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name} {a.role ? `(${a.role})` : ''}
                    </option>
                  ))}
                  <option value="__custom__">+ Enter Custom Name...</option>
                </select>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter organizer's name..."
                    value={assignedName}
                    onChange={(e) => setAssignedName(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsCustomAssignee(false);
                      setAssignedName('');
                    }}
                  >
                    Select
                  </button>
                </div>
              )}
            </div>

            {/* Folder Theme Accent Color */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Palette size={13} color="var(--primary)" />
                <span>Folder Color Theme</span>
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: color.value,
                      border: selectedColor === color.value ? '3px solid var(--text-main)' : '2px solid transparent',
                      boxShadow: selectedColor === color.value ? '0 0 0 2px var(--bg-surface)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      transition: 'transform var(--transition-fast)'
                    }}
                    title={color.label}
                  >
                    {selectedColor === color.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={13} color="var(--primary)" />
                <span>Tags (Optional, comma-separated)</span>
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. wedding, travel, q4, milestone"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!title.trim()}
              style={{ background: selectedColor, borderColor: selectedColor }}
            >
              <FolderKanban size={15} />
              <span>{initialEvent ? 'Save Changes' : 'Create Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null;
};
