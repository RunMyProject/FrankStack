/**
 * App.tsx
 * Main Application Component
 * -----------------------
 * Sets up React Router for the application.
 * - Defines routes for pages
 * - Currently contains only Home page at root path
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

/**
 * Main App component
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root path renders Home page */}
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
