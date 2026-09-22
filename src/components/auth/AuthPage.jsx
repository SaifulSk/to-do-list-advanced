import React, { useState } from 'react';
import { Lock, Mail, User, AlertCircle, CheckCircle2, ArrowRight, CheckSquare, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthPage = ({ theme, toggleTheme }) => {
  const { login, register, authError, setAuthError } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setAuthError(null);

    try {
      if (mode === 'register') {
        await register(email, password, displayName);
        setSuccessMsg('Account created successfully! Welcome to Zenith.');
      } else {
        await login(email, password);
        setSuccessMsg('Welcome back! Logging you in...');
      }
    } catch (err) {
      console.error('Authentication error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatErrorMessage = (errorStr) => {
    if (!errorStr) return null;
    if (errorStr.includes('auth/configuration-not-found') || errorStr.includes('auth/operation-not-allowed')) {
      return 'Email/Password sign-in is not enabled in your Firebase project. Please enable "Email/Password" in Firebase Console > Authentication > Sign-in method.';
    }
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
    <div className="auth-landing-wrapper">
      {/* Theme Toggle in top right */}
      <div style={{ position: 'absolute', top: '20px', right: '24px' }}>
        <button 
          className="btn-icon" 
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      <div className="auth-landing-card">
        {/* Brand Header */}
        <div className="auth-landing-header">
          <div className="brand-icon" style={{ width: '42px', height: '42px' }}>
            <CheckSquare size={22} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', margin: 0 }}>
            Zenith<span style={{ color: 'var(--primary)' }}>.</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {mode === 'login' ? 'Sign in to access your workspace' : 'Create an account to get started'}
          </p>
        </div>

        <div className="auth-landing-body">
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
              Create Account
            </div>
          </div>

          {/* Error Message */}
          {authError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--priority-urgent-bg)', border: '1px solid var(--priority-urgent-border)', borderRadius: 'var(--radius-md)', color: 'var(--priority-urgent)', fontSize: '0.8125rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{formatErrorMessage(authError)}</span>
            </div>
          )}

          {/* Success Message */}
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
                <input
                  type="text"
                  className="input"
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="name@example.com"
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
              style={{ width: '100%', marginTop: '8px', padding: '10px' }}
              disabled={loading}
            >
              <span>{loading ? 'Authenticating...' : (mode === 'login' ? 'Sign In' : 'Create Account')}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
