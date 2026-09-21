import React, { useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal = ({ isOpen, onClose }) => {
  const { currentUser, login, register, loginAsDemo, logout, authError, setAuthError } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setAuthError(null);

    try {
      if (mode === 'register') {
        await register(email, password, displayName);
        setSuccessMsg('Account created successfully!');
      } else {
        await login(email, password);
        setSuccessMsg('Logged in successfully!');
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    loginAsDemo();
    onClose();
  };

  const formatErrorMessage = (errorStr) => {
    if (!errorStr) return null;
    if (errorStr.includes('auth/invalid-credential') || errorStr.includes('auth/wrong-password')) {
      return 'Invalid email or password. Please check your credentials.';
    }
    if (errorStr.includes('auth/email-already-in-use')) {
      return 'This email address is already registered. Please log in.';
    }
    if (errorStr.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters long.';
    }
    if (errorStr.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    return errorStr;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Lock size={18} color="var(--primary)" />
            <span>{currentUser ? 'User Profile' : (mode === 'login' ? 'Sign In' : 'Create Account')}</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {currentUser ? (
            /* Logged in state */
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
                <div style={{ marginTop: '8px' }}>
                  <span className="badge" style={{ background: currentUser.isDemo ? 'rgba(245, 158, 11, 0.15)' : 'var(--success-bg)', color: currentUser.isDemo ? '#f59e0b' : 'var(--success)' }}>
                    {currentUser.isDemo ? '⚡ Local Demo Session' : '🔥 Firebase Cloud Authenticated'}
                  </span>
                </div>
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
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* Auth Form */
            <>
              {/* Tab selector */}
              <div className="auth-tabs">
                <div 
                  className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => { setMode('login'); setAuthError(null); }}
                >
                  Sign In
                </div>
                <div 
                  className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => { setMode('register'); setAuthError(null); }}
                >
                  Register
                </div>
              </div>

              {/* Feedback messages */}
              {authError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--priority-urgent-bg)', border: '1px solid var(--priority-urgent-border)', borderRadius: 'var(--radius-md)', color: 'var(--priority-urgent)', fontSize: '0.8125rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{formatErrorMessage(authError)}</span>
                </div>
              )}

              {successMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', color: 'var(--success)', fontSize: '0.8125rem' }}>
                  <CheckCircle2 size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {mode === 'register' && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="input"
                        placeholder="Alex Morgan"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '4px' }}
                  disabled={loading}
                >
                  <span>{loading ? 'Please wait...' : (mode === 'login' ? 'Sign In with Firebase' : 'Create Account')}</span>
                  <ArrowRight size={15} />
                </button>
              </form>

              {/* Instant Demo Login Shortcut */}
              <div className="demo-login-box">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Want to explore without typing credentials?
                </span>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
                  onClick={handleDemoLogin}
                >
                  ⚡ One-Click Demo Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
