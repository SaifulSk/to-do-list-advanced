import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  isConfigured as isFirebaseLive, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from '../services/firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Default sample user for zero-friction demo mode
const DEFAULT_DEMO_USER = {
  uid: 'demo-user-123',
  displayName: 'Alex Morgan',
  email: 'alex.morgan@zenith.design',
  photoURL: null,
  isDemo: true
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    // Check if user was logged into demo mode in session
    const savedDemo = localStorage.getItem('zenith_demo_user');
    if (savedDemo) {
      try {
        return JSON.parse(savedDemo);
      } catch (e) {
        return DEFAULT_DEMO_USER;
      }
    }
    // By default, start in demo mode so the user has immediate access without blank screen
    return isFirebaseLive ? null : DEFAULT_DEMO_USER;
  });

  const [loading, setLoading] = useState(isFirebaseLive);
  const [authError, setAuthError] = useState(null);

  // Subscribe to Firebase Auth state if configured
  useEffect(() => {
    if (!isFirebaseLive || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL,
          isDemo: false
        });
        localStorage.removeItem('zenith_demo_user');
      } else {
        // If not logged into Firebase, check if demo user was active
        const savedDemo = localStorage.getItem('zenith_demo_user');
        if (savedDemo) {
          setCurrentUser(JSON.parse(savedDemo));
        } else {
          setCurrentUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithFirebase = async (email, password) => {
    setAuthError(null);
    if (!isFirebaseLive || !auth) {
      throw new Error('Firebase credentials are not configured yet. Please configure Firebase or use Demo Mode.');
    }
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      localStorage.removeItem('zenith_demo_user');
      return res.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const registerWithFirebase = async (email, password, displayName) => {
    setAuthError(null);
    if (!isFirebaseLive || !auth) {
      throw new Error('Firebase credentials are not configured yet. Please configure Firebase or use Demo Mode.');
    }
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && res.user) {
        await updateProfile(res.user, { displayName });
      }
      localStorage.removeItem('zenith_demo_user');
      return res.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const loginAsDemo = (name = 'Alex Morgan', email = 'alex.morgan@zenith.design') => {
    const demoUser = {
      uid: 'demo-user-123',
      displayName: name,
      email: email,
      photoURL: null,
      isDemo: true
    };
    setCurrentUser(demoUser);
    localStorage.setItem('zenith_demo_user', JSON.stringify(demoUser));
    setAuthError(null);
  };

  const logout = async () => {
    setAuthError(null);
    if (isFirebaseLive && auth && currentUser && !currentUser.isDemo) {
      await signOut(auth);
    }
    localStorage.removeItem('zenith_demo_user');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    isFirebaseConnected: isFirebaseLive,
    loading,
    authError,
    setAuthError,
    login: loginWithFirebase,
    register: registerWithFirebase,
    loginAsDemo,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
