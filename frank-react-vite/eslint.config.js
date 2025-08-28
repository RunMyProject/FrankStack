/**
 * eslint.config.js
 * ESLint Configuration
 * -----------------------
 * Configures ESLint for the project with TypeScript, React, and Vite support.
 * - Applies recommended rules for JavaScript, TypeScript, and React Hooks
 * - Includes Vite-specific plugin for fast refresh
 * - Ignores build output and distribution folders
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

export default tseslint.config([
  // Ignore specified global folders
  globalIgnores(['dist']),

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,               // Recommended JS rules
      tseslint.configs.recommended,         // Recommended TypeScript rules
      reactHooks.configs['recommended-latest'], // Recommended React Hooks rules
      reactRefresh.configs.vite,            // Vite plugin for fast refresh
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,             // Browser globals
    },
  },
]);
