import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { initializeSentry } from './utils/sentry';
import { initializePlausible } from './utils/plausible';

// Initialize error tracking FIRST
initializeSentry();

// Initialize privacy-friendly analytics
initializePlausible();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
