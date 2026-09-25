import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register Service Worker for Mobile PWA Push Notifications
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Uses Vite's base path so it resolves correctly both locally and on GitHub Pages
    const base = import.meta.env.BASE_URL || './';
    const swPath = `${base.replace(/\/$/, '')}/sw.js`;
    navigator.serviceWorker.register(swPath).then((reg) => {
      // SW registered
    }).catch((err) => {
      console.warn('Zenith SW registration failed:', err);
    });
  });
}
