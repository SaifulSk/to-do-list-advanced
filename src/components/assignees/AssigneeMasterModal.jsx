import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Plus, Trash2, ShieldCheck, Briefcase, AlertTriangle } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

export const AssigneeMasterModal = ({ isOpen, onClose }) => {
  const { assignees, addAssignee, deleteAssignee, tasks } = useTasks();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [memberToDelete, setMemberToDelete] = useState(null);
  const nameInputRef = useRef(null);

  // Clear inputs whenever the modal opens or closes
  useEffect(() => {
    setName('');
    setRole('');
    setError('');
    setMemberToDelete(null);
    if (isOpen) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an assignee name');
      return;
    }

    const memberName = name.trim();
    const memberRole = role.trim();

    // Clear fields immediately so the form is clean and ready for the next entry
    setName('');
    setRole('');
    setError('');

    // Persist to context and Firestore
    await addAssignee(memberName, memberRole);

    // Keep focus on the name input for quick batch additions
    nameInputRef.current?.focus();
  };

  const getTaskCountForAssignee = (assigneeName) => {
    return tasks.filter(t => t.assignedTo?.name?.toLowerCase() === assigneeName.toLowerCase() && t.status !== 'completed').length;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Users size={18} color="var(--primary)" />
            <span>Assignee Master Directory</span>
          </div>
          <button className="btn-icon" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '20px' }}>
          {/* Add New Assignee Form */}
          <form onSubmit={handleAdd} style={{ background: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} color="var(--primary)" /> Add Team Member to Master
            </span>

            {error && (
              <span style={{ fontSize: '0.75rem', color: 'var(--priority-urgent)' }}>{error}</span>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
              <input
                ref={nameInputRef}
                type="text"
                className="input"
                placeholder="Full Name (e.g. Sarah Chen)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="text"
                className="input"
                placeholder="Role / Tag (e.g. Designer)"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px', alignSelf: 'flex-end', fontSize: '0.8125rem' }}>
              <Plus size={14} />
              <span>Add to Directory</span>
            </button>
          </form>

          {/* Master Directory List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Registered Assignees ({assignees.length})
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Available in task assignments
              </span>
            </div>

            {assignees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-medium)', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No team members in master directory yet. Use the form above to add your team members.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {assignees.map((assignee) => {
                  const activeCount = getTaskCountForAssignee(assignee.name);
                  return (
                    <div
                      key={assignee.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                          {assignee.avatar || assignee.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {assignee.name}
                          </div>
                          {assignee.role && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {assignee.role}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="badge badge-date" style={{ fontSize: '0.7rem' }}>
                          {activeCount} active task{activeCount === 1 ? '' : 's'}
                        </span>
                        <button
                          className="btn-icon"
                          style={{ width: '28px', height: '28px', color: 'var(--priority-urgent)' }}
                          onClick={() => setMemberToDelete(assignee)}
                          title={`Delete ${assignee.name} from master`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>

      {/* Delete Member Confirmation Modal rendered via Portal to document.body */}
      {memberToDelete && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setMemberToDelete(null)} style={{ zIndex: 10000 }}>
          <div 
            className="modal-dialog" 
            style={{ maxWidth: '400px', animation: 'modalFadeIn 0.15s ease' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title" style={{ color: 'var(--priority-urgent)' }}>
                <AlertTriangle size={18} color="var(--priority-urgent)" />
                <span>Remove Team Member</span>
              </div>
              <button 
                className="btn-icon" 
                onClick={() => setMemberToDelete(null)} 
                type="button"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 20px', gap: '8px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to remove <strong style={{ color: 'var(--text-main)' }}>"{memberToDelete.name}"</strong> from the master directory?
              </p>
              <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', margin: 0 }}>
                They will no longer appear in the assignee dropdown for future tasks.
              </p>
            </div>

            <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setMemberToDelete(null)}
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
                  deleteAssignee(memberToDelete.id);
                  setMemberToDelete(null);
                }}
              >
                <Trash2 size={14} />
                <span>Remove Member</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
