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

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Subscribe to Firebase Auth state
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
          photoURL: user.photoURL
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithFirebase = async (email, password) => {
    setAuthError(null);
    if (!isFirebaseLive || !auth) {
      throw new Error('Firebase is not initialized.');
    }
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      return res.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const registerWithFirebase = async (email, password, displayName) => {
    setAuthError(null);
    if (!isFirebaseLive || !auth) {
      throw new Error('Firebase is not initialized.');
    }
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && res.user) {
        await updateProfile(res.user, { displayName });
      }
      return res.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    setAuthError(null);
    if (isFirebaseLive && auth) {
      await signOut(auth);
    }
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
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
