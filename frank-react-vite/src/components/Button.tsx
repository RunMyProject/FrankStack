/**
 * Button.tsx
 * Reusable Button Component
 * -----------------------
 * Simple reusable button component for the project.
 * - Accepts children as content
 * - Optional onClick handler
 * - Styled with TailwindCSS
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;       // Content inside the button
  onClick?: () => void;            // Optional click handler
}

export default function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      {children}
    </button>
  );
}
