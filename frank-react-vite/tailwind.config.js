/**
 * tailwind.config.js
 * Tailwind CSS Configuration
 * -----------------------
 * Configures TailwindCSS for the project.
 * - Specifies content paths to purge unused styles
 * - Extends default theme with custom animations, keyframes, and transition delays
 * - No additional plugins used
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom keyframes for animations
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseCustom: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
      },
      // Custom transition delays
      transitionDelay: {
        200: '200ms',
        400: '400ms',
      },
      // Custom animation utilities
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in',
        pulseCustom: 'pulseCustom 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
};
