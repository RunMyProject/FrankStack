/**
 * useServerHealth.ts
 * Server Health Hook
 * -----------------------
 * Custom hook to monitor the health of the Node.js server.
 * - Checks server endpoint periodically
 * - Updates server status ('connecting', 'online', 'offline')
 * - Supports optional debug logging
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import { useEffect, useRef, useState } from 'react';
import type { ServerStatus } from '../types/chat';

/**
 * useServerHealth hook
 * @param debugMode Enable debug logs
 * @param addLog Optional function to append debug logs
 * @returns Current server status ('connecting', 'online', 'offline')
 */
export const useServerHealth = (
  debugMode = false,
  addLog?: (msg: string) => void
): ServerStatus => {
  const [status, setStatus] = useState<ServerStatus>('connecting');
  const timer = useRef<number | null>(null);

  useEffect(() => {
    /**
     * Performs a single server health check
     */
    const checkServerHealth = async () => {
      try {
        const response = await fetch('http://localhost:3000/health');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setStatus('online');
        if (debugMode && addLog) addLog('Server health check OK');
      } catch (error: unknown) {
        setStatus('offline');
        if (error instanceof Error && debugMode && addLog) {
          addLog(`Server health check failed: ${error.message}`);
        }
      }
    };

    // Initial check
    checkServerHealth();

    // Repeat check every 30 seconds
    timer.current = window.setInterval(checkServerHealth, 30000);

    // Cleanup interval on unmount
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [debugMode, addLog]);

  return status;
};
