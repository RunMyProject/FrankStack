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
 * Date: 31 August 2025
 */


import { create } from 'zustand';
import type { AIContext } from '../types/chat';

/**
 * Authentication state interface
 */
interface AuthState {
  user: string | null;                                      // Current logged-in user
  isAuthenticated: boolean;                                 // Authentication flag
  aIContext: AIContext;                                     // The AI context
  login: (username: string, password: string) => void;      // Login action
  logout: () => void;                                       // Logout action
  updateAIContext: (context: Partial<AIContext>) => void;   // Update AI context
}

/**
 * Default AI context values for the model
 */
const defaultAIContext: AIContext = {
  system: {
    maxWords: 50,
    user: "",
    userLang: "English",
    aiName: "FrankStack (Travel Assistant)",
    currentDateTime: "",
    weather: "",
    temperatureWeather: 0,
    bookingSystemEnabled: false
  },
  form: {
    tripDeparture: "",
    tripDestination: "",
    dateTimeRoundTripDeparture: "",
    dateTimeRoundTripReturn: "",
    durationOfStayInDays: 0,
    travelMode: "",
    budget: 0,
    people: 0,
    starsOfHotel: 0,
    luggages: 0
  },
  input: "",
  output: ""
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
      set((state) => ({
        user: username,
        isAuthenticated: true,
        aIContext: {
          ...state.aIContext,
          system: {
            ...state.aIContext.system,
            user: "Edoardo",
            userLang: "Italian"
          },
          form: {
            ...state.aIContext.form
          }
        }
      }));
    } else {
      console.error("Invalid credentials");
    }
  },

  logout: () => set({
    user: null,
    isAuthenticated: false,
    aIContext: defaultAIContext
  }),

  updateAIContext: (partial) =>
    set((state) => ({
      aIContext: {
        ...state.aIContext,
        ...partial,
        system: {
          ...state.aIContext.system,
          ...(partial.system || {})
        },
        form: {
          ...state.aIContext.form,
          ...(partial.form || {})
        }
      }
    }))
}));
