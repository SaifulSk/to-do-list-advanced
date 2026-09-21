import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

// User's provided Firebase configuration
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBn5puSUc0pq_q4QTDMWqbqnHKM9QOktiY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "todo-advanced-27e80.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "todo-advanced-27e80",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "todo-advanced-27e80.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "68585655009",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:68585655009:web:055ea8e65b395c853b45a0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HFFBX2VFV0"
};

const STORAGE_CONFIG_KEY = 'zenith_firebase_config';

/**
 * Reads Firebase configuration from localStorage override or default configuration.
 */
export const getActiveFirebaseConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read stored Firebase config', e);
  }

  return DEFAULT_FIREBASE_CONFIG;
};

// Initialize Firebase App
let app = null;
let auth = null;
let db = null;
let isConfigured = false;

const config = getActiveFirebaseConfig();

try {
  app = getApps().length > 0 ? getApp() : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  isConfigured = true;
} catch (error) {
  console.error('Failed to initialize Firebase with provided credentials:', error);
  isConfigured = false;
}

export { app, auth, db, isConfigured };

/**
 * Save custom Firebase configuration to localStorage.
 */
export const saveFirebaseConfig = (newConfig) => {
  try {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(newConfig));
    return true;
  } catch (e) {
    console.error('Error saving config to localStorage', e);
    return false;
  }
};

/**
 * Reset Firebase configuration back to user default.
 */
export const clearFirebaseConfig = () => {
  localStorage.removeItem(STORAGE_CONFIG_KEY);
};

/* --- Real-Time Firestore Tasks API --- */

export const subscribeToUserTasks = (userId, onData, onError) => {
  if (!db || !isConfigured) return () => {};

  try {
    const q = query(
      collection(db, 'todos'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt,
      }));
      onData(tasks);
    }, (error) => {
      console.warn('Firestore subscription error (e.g. security rules or index setup):', error);
      if (onError) onError(error);
    });
  } catch (err) {
    console.warn('Failed to query firestore tasks:', err);
    if (onError) onError(err);
    return () => {};
  }
};

export const addTaskToFirestore = async (taskData) => {
  if (!db || !isConfigured) throw new Error('Firebase DB is not initialized');
  return await addDoc(collection(db, 'todos'), {
    ...taskData,
    createdAt: taskData.createdAt || new Date().toISOString().split('T')[0],
    serverTimestamp: serverTimestamp()
  });
};

export const updateTaskInFirestore = async (taskId, updates) => {
  if (!db || !isConfigured) throw new Error('Firebase DB is not initialized');
  const taskRef = doc(db, 'todos', taskId);
  return await updateDoc(taskRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
};

export const deleteTaskFromFirestore = async (taskId) => {
  if (!db || !isConfigured) throw new Error('Firebase DB is not initialized');
  const taskRef = doc(db, 'todos', taskId);
  return await deleteDoc(taskRef);
};

/* --- Firebase Authentication Exports --- */

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
};
