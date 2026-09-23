import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  PALETTES, 
  DEFAULT_PALETTE_ID, 
  applyThemePalette 
} from '../services/themePalettes';
import { getUserPreferences, saveUserPreferences } from '../services/firebase';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { currentUser } = useAuth();

  // 1. Theme mode ('dark' | 'light')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('zenith_theme') || 'dark';
  });

  // 2. Current palette (preset ID or custom hex)
  const [currentPalette, setCurrentPalette] = useState(() => {
    return localStorage.getItem('zenith_current_palette') || DEFAULT_PALETTE_ID;
  });

  // 3. Status indicator for save confirmation
  const [isSavingPalette, setIsSavingPalette] = useState(false);

  // 4. Default workspace view ('list' | 'table' | 'calendar')
  const [defaultView, setDefaultView] = useState(() => {
    return localStorage.getItem('zenith_default_view') || 'list';
  });

  // Apply theme mode & active palette whenever theme or currentPalette changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('zenith_theme', theme);
    applyThemePalette(currentPalette, theme);
  }, [theme, currentPalette]);

  // Account-Wise Preferences Loader: Load when currentUser changes
  useEffect(() => {
    if (!currentUser) {
      // Fallback to general preferences when no user is logged in
      const general = localStorage.getItem('zenith_current_palette') || DEFAULT_PALETTE_ID;
      setCurrentPalette(general);
      applyThemePalette(general, theme);

      const generalView = localStorage.getItem('zenith_default_view') || 'list';
      setDefaultView(generalView);
      return;
    }

    const userKey = `zenith_palette_${currentUser.uid}`;
    const cachedUserPalette = localStorage.getItem(userKey);

    if (cachedUserPalette) {
      setCurrentPalette(cachedUserPalette);
      applyThemePalette(cachedUserPalette, theme);
    }

    const viewKey = `zenith_default_view_${currentUser.uid}`;
    const cachedUserView = localStorage.getItem(viewKey);
    if (cachedUserView) {
      setDefaultView(cachedUserView);
    }

    // Also fetch remote preference from Firestore for cross-device sync
    let isCancelled = false;
    getUserPreferences(currentUser.uid).then((prefs) => {
      if (isCancelled || !prefs) return;
      if (prefs.palette && prefs.palette !== cachedUserPalette) {
        setCurrentPalette(prefs.palette);
        localStorage.setItem(userKey, prefs.palette);
        localStorage.setItem('zenith_current_palette', prefs.palette);
        applyThemePalette(prefs.palette, theme);
      }
      if (prefs.defaultView && prefs.defaultView !== cachedUserView) {
        setDefaultView(prefs.defaultView);
        localStorage.setItem(viewKey, prefs.defaultView);
        localStorage.setItem('zenith_default_view', prefs.defaultView);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [currentUser, theme]);

  // Toggle theme mode (dark vs light)
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Set and persist account-wise palette
  const setAccountPalette = useCallback(async (paletteIdOrHex) => {
    if (!paletteIdOrHex) return;

    setCurrentPalette(paletteIdOrHex);
    localStorage.setItem('zenith_current_palette', paletteIdOrHex);
    applyThemePalette(paletteIdOrHex, theme);

    if (currentUser?.uid) {
      setIsSavingPalette(true);
      const userKey = `zenith_palette_${currentUser.uid}`;
      localStorage.setItem(userKey, paletteIdOrHex);
      
      try {
        await saveUserPreferences(currentUser.uid, { palette: paletteIdOrHex });
      } catch (err) {
        console.warn('Could not persist palette to Firestore:', err);
      } finally {
        setTimeout(() => setIsSavingPalette(false), 800);
      }
    }
  }, [currentUser, theme]);

  // Set and persist account-wise default view
  const setAccountDefaultView = useCallback(async (view) => {
    if (!view) return;

    setDefaultView(view);
    localStorage.setItem('zenith_default_view', view);

    if (currentUser?.uid) {
      const viewKey = `zenith_default_view_${currentUser.uid}`;
      localStorage.setItem(viewKey, view);
      
      try {
        await saveUserPreferences(currentUser.uid, { defaultView: view });
      } catch (err) {
        console.warn('Could not persist defaultView to Firestore:', err);
      }
    }
  }, [currentUser]);

  const value = {
    theme,
    toggleTheme,
    currentPalette,
    setAccountPalette,
    availablePalettes: PALETTES,
    isSavingPalette,
    defaultView,
    setDefaultView: setAccountDefaultView
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
