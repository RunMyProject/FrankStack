/**
 * useAuthStore.ts
 * Authentication Store
 * -----------------------
 * Zustand store to manage authentication state.
 * - Tracks current user and authentication status
 * - Provides login and logout actions
 * - Maintains AI context with defaults
 * 
 * Author: Edoardo Sabatini
 * Date: 30 August 2025
 */

import { create } from 'zustand';
import type { AIContext } from '../types/chat';

/**
 * Authentication state interface
 */
interface AuthState {
  user: string | null;                                     // Current logged-in user
  isAuthenticated: boolean;                                // Authentication flag
  aIContext: AIContext;                                    // The AI context
  login: (username: string, password: string) => void;     // Login action
  logout: () => void;                                      // Logout action
  updateAIContext: (context: Partial<AIContext>) => void;  // Update AI context
}

/**
 * Default AI context values
 */
const defaultAIContext: AIContext = {
  maxWords: 50,
  user: '',
  userLang: 'EN',
  aiName: 'FrankStack (Travel Assistant)',
  cityStart: '',
  cityEnd: '',
  kindOfTravel: '',
  maxBudget: '',
  numberOfPeople: '',
  starsOfHotel: '',
  durationInDays: '',
  dateTimeStart: '',
  dateTimeEnd: '',
  numberOfLuggage: '',
  currentDateTime: '',
  weather: '',
  temperature: 0,
  question: '',
  answer: "*",
  rules: "1: If any fields are missing, include them in the JSON output with the value '?' and set 'answer' to a natural prompt asking for the missing info. \
          2: If all fields are present, set 'answer' to 'ok'. \
          3: Return only JSON, maintaining the original input structure, with the filled fields retrieved from the question, no extra explanations or comments."
};

/**
 * Zustand store for authentication
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  aIContext: defaultAIContext,

  login: (username, password) => {
    if (username === "Edoardo" && password === "12345") {
      set({ user: username, isAuthenticated: true });
    } else {
      console.error("Invalid credentials");
    }
  },

  logout: () => set({ 
    user: null, 
    isAuthenticated: false,
    aIContext: defaultAIContext
  }),

  updateAIContext: (context) =>
    set((state) => ({
      aIContext: { ...state.aIContext, ...context }
    })),
}));
