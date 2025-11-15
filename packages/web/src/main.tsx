import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { initializeSentry } from './utils/sentry';
import './i18n/config'; // Initialize i18n

// Initialize error tracking FIRST
initializeSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
