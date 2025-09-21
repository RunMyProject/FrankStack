/**
 * useAI.ts
 * AI Hook for Chat Requests via WebSocket
 * -----------------------
 * Custom React hook to send AI requests to a WebSocket server.
 * Provides:
 *   - callAI(): sends a request and returns AIContext as Promise
 *   - stopAI(): stops the current AI request
 * Handles:
 *   - Server status updates
 *   - Final AI responses
 *   - Error handling and safe parsing of server messages
 *
 * Author: Assistant (adapted for Edoardo)
 * Date: 21 September 2025
 */

import { useRef } from 'react';
import type { AIContext, Provider, AIRequestPayload, AIStatus } from '../types/chat';

/**
 * ServerResponse interface
 * Represents the possible WebSocket messages from the server
 */
interface ServerResponse {
  type: 'status' | 'final' | 'error';
  message?: string;
  data?: {
    response: AIContext;
    debug?: {
      rawOutput: string;
      cleanedJSON: string;
      timestamp: string;
      model: string;
    };
    error?: string;
  };
}

// Type for the optional status callback
export type OnStatusCallback = (status: AIStatus) => void;

/**
 * useAI Hook
 * React hook to manage AI requests and WebSocket connection.
 * Provides callAI() and stopAI() functions to the consumer.
 */
export const useAI = (
  provider: Provider, 
  apiKey: string, 
  onStatus?: OnStatusCallback
) => {
  const serverUrl = 'ws://localhost:3000';
  const TIMEOUT_MS = 120000; // 2 minutes

  // Ref to store the active WebSocket connection
  const currentWebSocketRef = useRef<WebSocket | null>(null);

  /**
   * callAI
   * Sends an AI request to the server and returns a Promise resolving to AIContext.
   * Handles server status, final, and error messages, with timeout and safe parsing.
   */
  const callAI = (aIContext: AIContext): Promise<AIContext> => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(serverUrl);
      currentWebSocketRef.current = ws;

      // Timeout to prevent hanging connections
      const timeout = setTimeout(() => {
        ws.close();
        currentWebSocketRef.current = null;
        reject(new Error('Request timed out'));
      }, TIMEOUT_MS);

      // Cleanup helper function
      const cleanup = () => {
        clearTimeout(timeout);
        currentWebSocketRef.current = null;
      };

      // WebSocket open: send payload
      ws.onopen = () => {
        const payload: AIRequestPayload = {
          aIContext,
          provider,
          ...(provider === 'chatgpt' ? { apiKey } : {})
        };

        if (provider === 'chatgpt' && (!apiKey || !apiKey.trim())) {
          cleanup();
          ws.close();
          reject(new Error('API Key required for ChatGPT'));
          return;
        }

        console.log('🚀 Sending payload via WebSocket:', payload);
        ws.send(JSON.stringify(payload));
      };

      // WebSocket message handler
      ws.onmessage = (event) => {
        try {
          const serverResponse: ServerResponse = JSON.parse(event.data.toString());

          if (serverResponse.type === 'status') {
            if (onStatus && serverResponse.message) {
              onStatus({
                msg: serverResponse.message,
                status: 'thinking',
                data: serverResponse.data
              });
            }

          } else if (serverResponse.type === 'final') {
            cleanup();

            if (onStatus) {
              onStatus({
                msg: 'Completed',
                status: 'done',
                data: serverResponse.data
              });
            }

            if (serverResponse.data?.response) {
              resolve(serverResponse.data.response);
            } else {
              reject(new Error('Final response missing "response" field'));
            }
            ws.close();

          } else if (serverResponse.type === 'error') {
            cleanup();

            if (onStatus) {
              onStatus({
                msg: serverResponse.message || 'Unknown error',
                status: 'error',
                data: serverResponse.data
              });
            }

            reject(new Error(serverResponse.message || 'Unknown server error'));
            ws.close();
          }
        } catch (e) {
          if (e instanceof Error) {
            cleanup();
            if (onStatus) {
              onStatus({
                msg: 'Parse error',
                status: 'error',
                data: {}
              });
            }
            reject(new Error(`Failed to parse server message: ${event.data}`));
            ws.close();
          }
        }
      };

      // WebSocket close event
      ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event);
        cleanup();
      };

      // WebSocket error event
      ws.onerror = (error) => {
        cleanup();
        console.error('💥 WebSocket error:', error);
        if (onStatus) {
          onStatus({ msg: 'Connection error', status: 'error', data: {} });
        }
        reject(new Error('WebSocket connection error'));
      };
    });
  };

  /**
   * stopAI
   * Stops the active AI request by sending a 'stop' message and closing the WebSocket.
   * Calls onStatus callback to notify the user.
   */
  const stopAI = () => {
    if (currentWebSocketRef.current) {
      console.log('🛑 Stopping AI request');

      try {
        currentWebSocketRef.current.send(JSON.stringify({
          type: 'stop',
          message: 'Client requested stop'
        }));
      } catch (e) {
        if (e instanceof Error) console.log('Failed to send stop message, closing connection directly');
      }

      currentWebSocketRef.current.close();
      currentWebSocketRef.current = null;

      if (onStatus) {
        onStatus({ msg: 'Stopped by user', status: 'stopped', data: {} });
      }
    }
  };

  return { callAI, stopAI };
};
