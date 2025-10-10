/**
 * useAuthStore.ts
 * -----------------------
 * Zustand store to manage authentication state.
 *
 * Features:
 * - Tracks authentication status (isAuthenticated)
 * - Manages AI context with default values
 * - Handles login/logout logic
 * - Supports up to 2 locally saved payment methods (newest-first)
 *
 * AUTHOR: Edoardo Sabatini
 * DATE: 10 October 2025
 */

import { create } from 'zustand';
import type { AIContext } from '../types/chat';
import type { SavedPaymentMethod } from '../types/saga';

/**
 * Authentication store interface
 */
interface AuthState {
  // Auth state
  isAuthenticated: boolean;                                   // Whether the user is logged in
  aIContext: AIContext;                                       // Current AI context

  // Auth actions
  login: (username: string, password: string) => void;        // Login action
  logout: () => void;                                         // Logout action
  updateAIContext: (context: Partial<AIContext>) => void;     // Update AI context

  // Payment methods
  savedPaymentMethods: SavedPaymentMethod[];                  // Stored payment methods (max 2, newest-first)
  addPaymentMethod: (method: SavedPaymentMethod) => void;     // Add a payment method (keep max 2)
  removePaymentMethod: (id: string) => void;                  // Remove payment method by id
  setDefaultPaymentMethod: (id: string) => void;              // Mark a payment method as default
  printAllPaymentMethods: () => void;                         // Debug print
}

/**
 * Default AI context
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
 * Zustand store definition (no persistence)
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  aIContext: defaultAIContext,
  savedPaymentMethods: [],

  /**
   * Add a new payment method
   * - Newest methods are inserted first (FILO)
   * - Keep at most 2 methods
   * - If it's the first or marked as default, unset others
   */
  addPaymentMethod: (method) => {
    set((state) => {
      const isFirst = state.savedPaymentMethods.length === 0;
      const now = new Date();
      const timestamp = `${now.getDate().toString().padStart(2, '0')}/${
        (now.getMonth() + 1).toString().padStart(2, '0')
      }/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      const newMethod: SavedPaymentMethod = {
        ...method,
        isDefault: isFirst || !!method.isDefault,
        timestamp
      };

      const updatedExisting = newMethod.isDefault
        ? state.savedPaymentMethods.map((m) => ({ ...m, isDefault: false }))
        : [...state.savedPaymentMethods];

      const final = [newMethod, ...updatedExisting].slice(0, 2);
      return { savedPaymentMethods: final };
    });
  },

  /**
   * Remove a payment method by ID
   */
  removePaymentMethod: (id) =>
    set((state) => ({
      savedPaymentMethods: state.savedPaymentMethods.filter((m) => m.id !== id)
    })),

  /**
   * Mark one payment method as default
   */
  setDefaultPaymentMethod: (id) =>
    set((state) => ({
      savedPaymentMethods: state.savedPaymentMethods.map((m) => ({
        ...m,
        isDefault: m.id === id
      }))
    })),

  /**
   * Debug utility to print all payment methods
   */
  printAllPaymentMethods: () => {
    const { savedPaymentMethods } = get();
    console.log("🧾 **PRINT ALL PAYMENT METHODS**:");
    if (!savedPaymentMethods.length) {
      console.log("   --> No saved payment methods.");
      return;
    }
    savedPaymentMethods.forEach((m, i) => {
      console.log(`--- Method #${i + 1} ---`);
      console.log(` id: ${m.id}`);
      console.log(` type: ${m.type}`);
      console.log(` cardType: ${m.cardType}`);
      console.log(` lastFourDigits: ${m.lastFourDigits}`);
      console.log(` token: ${m.token}`);
      console.log(` isDefault: ${m.isDefault}`);
      console.log(` savedAt: ${m.timestamp}`);
    });
  },

  /**
   * Login logic (simple demo)
   * Updates context and sets isAuthenticated = true
   */
  login: (username, password) => {
    if (username === "Edoardo" && password === "12345") {
      set((state) => ({
        isAuthenticated: true,
        aIContext: {
          ...state.aIContext,
          system: {
            ...state.aIContext.system,
            user: "Edoardo",
            userLang: "Italian"
          }
        }
      }));
    } else {
      console.error("❌ Invalid credentials");
      set({ isAuthenticated: false });
    }
  },

  /**
   * Logout: restore defaults and reset authentication
   */
  logout: () =>
    set({
      isAuthenticated: false,
      aIContext: defaultAIContext
    }),

  /**
   * Partially update AI context
   */
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
