/**
 * main.tsx
 * Application Entry Point
 * -----------------------
 * Initializes the React application and mounts it to the DOM.
 * - Wraps the App component with React StrictMode
 * - Imports global CSS and main App component
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Mount the App component to the root element
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
