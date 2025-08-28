/**
 * vite.config.ts
 * Vite Configuration
 * -----------------------
 * Configures Vite for the project.
 * - Uses React SWC plugin for fast React compilation
 * - Can be extended with additional plugins or build options
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// Export Vite configuration
export default defineConfig({
  plugins: [
    react(), // React plugin with SWC compiler for better performance
  ],
});
