import React, { useState } from 'react';
import { X, Database, Check, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { getActiveFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig, isConfigured } from '../../services/firebase';

export const FirebaseConfigModal = ({ isOpen, onClose }) => {
  const currentConfig = getActiveFirebaseConfig();

  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig?.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const configToSave = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };
    saveFirebaseConfig(configToSave);
    setSavedSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleResetToDefault = () => {
    clearFirebaseConfig();
    window.location.reload();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Database size={18} color="var(--primary)" />
            <span>Firebase Cloud Configuration</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            {/* Status Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: 'var(--radius-md)', background: isConfigured ? 'var(--success-bg)' : 'rgba(245, 158, 11, 0.1)', border: `1px solid ${isConfigured ? 'var(--success-border)' : 'rgba(245, 158, 11, 0.3)'}` }}>
              {isConfigured ? <ShieldCheck size={22} color="var(--success)" /> : <AlertTriangle size={22} color="#f59e0b" />}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isConfigured ? 'var(--success)' : '#f59e0b' }}>
                  {isConfigured ? 'Connected to Firebase Project' : 'Using Local Offline Storage'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Project: <strong>{currentConfig?.projectId || 'todo-advanced-27e80'}</strong>
                </div>
              </div>
            </div>

            {savedSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', color: 'var(--success)', fontSize: '0.8125rem' }}>
                <Check size={16} />
                <span>Configuration saved! Reloading application...</span>
              </div>
            )}

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Your Firebase credentials are configured in <code>.env</code>. You can customize them below at any time:
            </p>

            <div className="form-group">
              <label className="form-label">Project ID</label>
              <input
                type="text"
                className="input"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">API Key</label>
              <input
                type="text"
                className="input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Auth Domain</label>
              <input
                type="text"
                className="input"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">App ID</label>
              <input
                type="text"
                className="input"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-ghost" onClick={handleResetToDefault}>
              <RefreshCw size={14} />
              <span>Reset Defaults</span>
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="btn btn-primary">
                Save & Connect
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
