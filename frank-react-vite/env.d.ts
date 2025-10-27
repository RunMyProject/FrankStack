// ================================================================
// env.d.ts
// FrankStack React - TypeScript Environment Declarations
// Provides type safety for Vite environment variables used in React
//
// Author: Edoardo Sabatini
// Date: 27 October 2025
// ================================================================

/// <reference types="vite/client" />

/**
 * ImportMetaEnv interface
 * ----------------------
 * Defines the environment variables available in the React app.
 * All variables prefixed with VITE_ are injected at build time
 * by Vite from the .env file. TypeScript will enforce correct usage.
 */
interface ImportMetaEnv {
  /** WebSocket URL for Node.js AI server */
  readonly VITE_AI_SERVER_URL: string;

  /** Timeout in milliseconds for AI requests */
  readonly VITE_AI_TIMEOUT_MS: string;

  /** Backend proxy URL for reverse geocoding (OpenStreetMap / Nominatim) */
  readonly VITE_LOCATION_PROXY_URL: string;

  // Add more VITE_ variables here if needed
}

/**
 * ImportMeta interface
 * -------------------
 * Provides access to ImportMetaEnv via import.meta.env
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ================================================================
// End of env.d.ts
// FrankStack React - TypeScript Environment Declarations
// ================================================================
