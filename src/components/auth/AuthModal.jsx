import React, { useState } from 'react';
import { 
  X, 
  User, 
  LogOut, 
  Palette, 
  Check, 
  Pipette, 
  CheckCircle2, 
  List, 
  Table as TableIcon, 
  Calendar as CalendarIcon, 
  LayoutGrid, 
  Star 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const AuthModal = ({ isOpen, onClose, currentView, onSelectView }) => {
  const { currentUser, logout } = useAuth();
  const { 
    currentPalette, 
    setAccountPalette, 
    availablePalettes, 
    isSavingPalette,
    defaultView,
    setDefaultView
  } = useTheme();

  // Custom color state if user enters custom hex
  const isPreset = availablePalettes.some((p) => p.id === currentPalette);
  const [customHex, setCustomHex] = useState(isPreset ? '#10b981' : currentPalette);

  if (!isOpen || !currentUser) return null;

  const handleCustomColorChange = (e) => {
    const newColor = e.target.value;
    setCustomHex(newColor);
    setAccountPalette(newColor);
  };

  const handleSetDefaultView = (view) => {
    setDefaultView(view);
    onSelectView?.(view);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog" 
        style={{ maxWidth: '460px', width: '100%' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <User size={18} color="var(--primary)" />
            <span>Account Profile</span>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body account-modal-body">
          {/* User Info Header Card */}
          <div className="account-user-card">
            <div 
              className="avatar" 
              style={{ width: '48px', height: '48px', fontSize: '1.25rem', flexShrink: 0 }}
            >
              {currentUser.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="account-user-details" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.displayName || 'User'}
                </h3>
                <span style={{ 
                  fontSize: '0.6875rem', 
                  fontWeight: 600, 
                  background: 'var(--primary-light)', 
                  color: 'var(--primary)', 
                  padding: '1px 6px', 
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--primary-border)'
                }}>
                  Active
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.email}
              </p>
            </div>
          </div>

          <hr className="account-divider" />

          {/* Default Workspace View Section */}
          <div className="account-palette-section">
            <div className="account-palette-header">
              <div className="account-palette-title">
                <LayoutGrid size={15} color="var(--primary)" />
                <span>Default Workspace View</span>
              </div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                {defaultView.charAt(0).toUpperCase() + defaultView.slice(1)} View
              </span>
            </div>

            <p className="account-palette-desc">
              Choose which tab opens automatically when you start or refresh your workspace.
            </p>

            <div className="default-view-selector">
              <button
                type="button"
                className={`default-view-btn ${defaultView === 'list' ? 'active' : ''}`}
                onClick={() => handleSetDefaultView('list')}
                title="Set List as default view"
              >
                <div className="default-view-btn-inner">
                  <List size={16} />
                  <span>List</span>
                </div>
                {defaultView === 'list' ? (
                  <span className="default-view-badge">
                    <Star size={10} fill="currentColor" /> Default
                  </span>
                ) : (
                  <span className="default-view-sub">Set Default</span>
                )}
              </button>

              <button
                type="button"
                className={`default-view-btn ${defaultView === 'table' ? 'active' : ''}`}
                onClick={() => handleSetDefaultView('table')}
                title="Set Table as default view"
              >
                <div className="default-view-btn-inner">
                  <TableIcon size={16} />
                  <span>Table</span>
                </div>
                {defaultView === 'table' ? (
                  <span className="default-view-badge">
                    <Star size={10} fill="currentColor" /> Default
                  </span>
                ) : (
                  <span className="default-view-sub">Set Default</span>
                )}
              </button>

              <button
                type="button"
                className={`default-view-btn ${defaultView === 'calendar' ? 'active' : ''}`}
                onClick={() => handleSetDefaultView('calendar')}
                title="Set Calendar as default view"
              >
                <div className="default-view-btn-inner">
                  <CalendarIcon size={16} />
                  <span>Calendar</span>
                </div>
                {defaultView === 'calendar' ? (
                  <span className="default-view-badge">
                    <Star size={10} fill="currentColor" /> Default
                  </span>
                ) : (
                  <span className="default-view-sub">Set Default</span>
                )}
              </button>
            </div>
          </div>

          <hr className="account-divider" />

          {/* Account-Wise Color Palette Section */}
          <div className="account-palette-section">
            <div className="account-palette-header">
              <div className="account-palette-title">
                <Palette size={15} color="var(--primary)" />
                <span>Account Color Palette</span>
              </div>
              {isSavingPalette ? (
                <span className="palette-saved-badge">
                  <CheckCircle2 size={12} />
                  <span>Saving...</span>
                </span>
              ) : (
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                  Account-Synced
                </span>
              )}
            </div>

            <p className="account-palette-desc">
              Select an accent theme for your account. This color styles buttons, indicators, tabs, and markers across the entire workspace.
            </p>

            {/* Presets Grid */}
            <div className="account-palette-grid">
              {availablePalettes.map((p) => {
                const isActive = currentPalette === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`palette-swatch ${isActive ? 'active' : ''}`}
                    style={{ backgroundColor: p.primary }}
                    onClick={() => setAccountPalette(p.id)}
                    title={`${p.label} (${p.primary})`}
                  >
                    {isActive && (
                      <Check size={16} className="palette-swatch-check" strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Color Selector */}
            <div className="palette-custom-card">
              <div className="palette-custom-label">
                <Pipette size={14} color="var(--primary)" />
                <span>Custom Color Choice</span>
              </div>

              <div className="palette-custom-picker-wrap">
                <span className="palette-custom-hex">
                  {currentPalette.startsWith('#') ? currentPalette.toUpperCase() : customHex.toUpperCase()}
                </span>
                <input
                  type="color"
                  className="palette-custom-input"
                  value={currentPalette.startsWith('#') ? currentPalette : customHex}
                  onChange={handleCustomColorChange}
                  title="Choose custom color"
                />
              </div>
            </div>
          </div>

          <hr className="account-divider" />

          {/* Modal Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button 
              type="button"
              className="btn btn-secondary" 
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Done
            </button>
            <button 
              type="button"
              className="btn btn-danger" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                logout();
                onClose();
              }}
              title="Sign Out of Account"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
