/**
 * Home.tsx
 * Home Component
 * -----------------------
 * Main entry point for the application.
 * - Handles authentication state (login/logout)
 * - Displays login screen if user is not authenticated
 * - Renders Chat component when authenticated
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import Button from '../components/Button';
import ReactLogo from '../assets/react.svg';
import Chat from './Chat';

export default function Home() {
  // ----- Authentication state -----
  const { isAuthenticated, login, logout } = useAuthStore();

  // ----- Effect: logout on custom event -----
  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener('logout', handleLogout);
    return () => window.removeEventListener('logout', handleLogout);
  }, [logout]);

  // ----- Render -----
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {!isAuthenticated ? (
        // Login screen
        <>
          <img src={ReactLogo} className="w-32 h-32 animate-spin" alt="React logo" />
          <h1 className="text-2xl font-bold mt-4">Login Demo</h1>
          <Button onClick={() => login('Edoardo', '12345')}>Login</Button>
        </>
      ) : (
        // Authenticated: show chat
        <>
          <Chat />
        </>
      )}
    </div>
  );
}
