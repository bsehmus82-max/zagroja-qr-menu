import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './context/ToastContext';
import { registerServiceWorker } from './lib/notifications';
import './index.css';

// Register Service Worker for PWA & Background Push
registerServiceWorker();

// Prevent default browser context menu in POS & Desktop app (Geri, Yenile, Incele engelleme)
window.addEventListener('contextmenu', (e) => {
  const target = e.target as HTMLElement;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
    return;
  }
  e.preventDefault();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
