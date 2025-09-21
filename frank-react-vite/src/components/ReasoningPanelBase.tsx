/**
 * ReasoningPanelBase.tsx
 * Base Layout Component for Reasoning Panel
 * -----------------------
 * Reusable container for displaying reasoning or debug panels.
 *
 * Provides:
 *   - A styled panel fixed on the right side of the screen
 *   - Header with title and close button
 *   - Scrollable body area for dynamic content
 *
 * Author: Edoardo Sabatini
 * Date: September 21, 2025
 */

import React from "react";

/**
 * Component props
 */
interface BaseProps {
  title: string;            // Panel title text
  onClose: () => void;      // Callback triggered when closing the panel
  children: React.ReactNode;// Content of the panel
}

/**
 * Base container component for reasoning panels.
 * Handles layout, header with close action, and scrollable content area.
 */
const ReasoningPanelBase: React.FC<BaseProps> = ({ title, onClose, children }) => (
  <div className="fixed right-4 top-4 w-[420px] max-w-full bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[100vh] overflow-hidden flex flex-col">
    
    {/* Panel header with gradient background and close button */}
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex justify-between items-center">
      <h3 className="font-bold text-lg">{title}</h3>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 text-xl leading-none"
      >
        ×
      </button>
    </div>

    {/* Scrollable panel body */}
    <div className="flex-1 overflow-y-auto">{children}</div>
  </div>
);

export default ReasoningPanelBase;
