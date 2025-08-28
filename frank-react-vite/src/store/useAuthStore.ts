/**
 * useAuthStore.ts
 * Authentication Store
 * -----------------------
 * Zustand store to manage authentication state.
 * - Tracks current user and authentication status
 * - Provides login and logout actions
 * - Simple demo credentials check included
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import { create } from 'zustand';

/**
 * Authentication state interface
 */
interface AuthState {
  user: string | null;                 // Current logged-in user
  isAuthenticated: boolean;           // Authentication flag
  login: (username: string, password: string) => void;  // Login action
  logout: () => void;                  // Logout action
}

/**
 * Zustand store for authentication
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  /**
   * Login action
   * Simple demo check for credentials
   */
  login: (username, password) => {
    if (username === "Edoardo" && password === "12345") {
      set({ user: username, isAuthenticated: true });
    } else {
      alert("Credenziali non valide"); // Keep Italian message as requested
    }
  },

  /**
   * Logout action
   */
  logout: () => set({ user: null, isAuthenticated: false }),
}));
