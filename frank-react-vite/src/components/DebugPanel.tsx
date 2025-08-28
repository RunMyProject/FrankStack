/**
 * DebugPanel.tsx
 * Debug Panel Component
 * -----------------------
 * Displays debug logs in a scrollable panel.
 * - Receives an array of log strings as props
 * - Uses monospace font and color-coded styling
 * - TailwindCSS for styling
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import React from 'react';

type DebugPanelProps = {
  logs: string[]; // Array of log messages to display
};

const DebugPanel: React.FC<DebugPanelProps> = ({ logs }) => (
  <div className="bg-gray-900 text-green-400 p-4 max-h-48 overflow-y-auto font-mono text-xs debug-panel">
    {logs.map((log, index) => (
      <div key={index}>{log}</div>
    ))}
  </div>
);

export default DebugPanel;
