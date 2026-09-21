import React from 'react';
import { X, Lock, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();

  if (!isOpen || !currentUser) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <User size={18} color="var(--primary)" />
            <span>Account Profile</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '12px 0' }}>
            <div 
              className="avatar" 
              style={{ width: '64px', height: '64px', fontSize: '1.5rem', margin: '0 auto' }}
            >
              {currentUser.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{currentUser.displayName || 'User'}</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{currentUser.email}</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button 
                className="btn btn-danger" 
                style={{ flex: 1 }}
                onClick={() => {
                  logout();
                  onClose();
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
