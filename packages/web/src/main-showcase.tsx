/**
 * Showcase Entry Point
 *
 * This is the entry point for the GitHub Pages showcase.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import ShowcaseApp from './ShowcaseApp';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ShowcaseApp />
  </React.StrictMode>
);
