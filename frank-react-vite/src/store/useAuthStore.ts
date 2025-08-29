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
 * Date: 29 August 2025
 */

import { create } from 'zustand';
import type { Lang, WeatherData, LocationData } from '../types/chat';

/**
 * AI context interface
 */
interface AIContext {
  maxWords: number;
  lang: Lang;
  weatherData: WeatherData;
  locationData: LocationData;
}

/**
 * Authentication state interface
 */
interface AuthState {
  user: string | null;                                     // Current logged-in user
  isAuthenticated: boolean;                                // Authentication flag
  aiContext: AIContext;                                    // The AI context
  login: (username: string, password: string) => void;     // Login action
  logout: () => void;                                      // Logout action
  updateAIContext: (context: Partial<AIContext>) => void;  // Update AI context
}

/**
 * Default AI context values
 */
const defaultAIContext: AIContext = {
  maxWords: 50,       
  lang: 'EN',         
  weatherData: { icon: '', desc: '', temp: 0 },
  locationData: { city: '', lat: 0, lon: 0 },
};

/**
 * Zustand store for authentication
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  aiContext: defaultAIContext,

  /**
   * Login action
   * Simple demo check for credentials
   */
  login: (username, password) => {
    if (username === "Edoardo" && password === "12345") {
      set({ user: username, isAuthenticated: true });
    } else {
      console.error("Invalid credentials");
    }
  },

  /**
   * Logout action
   */
  logout: () => set({ 
    user: null, 
    isAuthenticated: false,
    aiContext: defaultAIContext
  }),

  /**
   * Update AI context
   */
  updateAIContext: (context) =>
    set((state) => ({
      aiContext: { ...state.aiContext, ...context }
    })),
}));
