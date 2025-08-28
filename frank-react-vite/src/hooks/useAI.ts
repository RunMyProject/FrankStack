/**
 * useAI.ts
 * AI Hook for Chat Requests
 * -----------------------
 * Custom hook to interact with AI providers (Ollama, ChatGPT).
 * - Handles API request, timeout, debug logging, and error handling
 * - Supports multiple languages (IT/EN)
 * - Automatically includes API key for ChatGPT
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import type { Lang, Provider, AIResponse, AIRequestPayload } from '../types/chat';

/**
 * useAI hook
 * @param provider Selected AI provider ('ollama' | 'chatgpt')
 * @param apiKey Optional API key for ChatGPT
 * @param debugMode Enable debug logs
 * @param addLog Optional function to append debug logs
 * @param lang Language for error messages ('IT' | 'EN')
 * @returns Object containing callAI function
 */
export const useAI = (
  provider: Provider,
  apiKey: string,
  debugMode = false,
  addLog?: (msg: string) => void,
  lang: Lang = 'IT'
) => {
  const serverUrl = 'http://localhost:3000'; // Node.js server port

  /**
   * Sends a message to the AI and returns the response
   * @param message User message to send
   * @returns AI response text
   */
  const callAI = async (message: string): Promise<string> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      if (debugMode && addLog) addLog('[EMERGENCY] Request timeout after 8 minutes!');
      controller.abort();
    }, 480000); // 8 minutes

    // Determine endpoint and payload based on provider
    const isChatEndpoint = provider === 'ollama' || provider === 'chatgpt';
    const endpoint = isChatEndpoint ? '/chat' : '/api/chat';

    const payload: AIRequestPayload = {
      message,
      provider,
      debug: debugMode,
      ...(provider === 'chatgpt' ? { apiKey } : {})
    };

    // Validate API key for ChatGPT
    if (provider === 'chatgpt' && !apiKey.trim()) {
      throw new Error(
        lang === 'EN' ? 'API Key required for ChatGPT' : 'API Key richiesta per ChatGPT'
      );
    }

    if (debugMode && addLog) {
      addLog(`Sending request to ${serverUrl}${endpoint}`);
      addLog(JSON.stringify(payload, null, 2));
    }

    try {
      const response = await fetch(`${serverUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout); // clear timer on response

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const data: AIResponse = await response.json();

      if (debugMode && addLog) {
        addLog('Server response:');
        addLog(JSON.stringify(data, null, 2));
      }

      if (data.success) return data.response as string;
      throw new Error(data.error || 'Unknown server error');

    } catch (error: unknown) {
      clearTimeout(timeout); // clear timer on error
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          if (addLog) addLog('[EMERGENCY] AbortError detected: request aborted due to timeout!');
          throw new Error(lang === 'EN' ? 'Request timed out' : 'Richiesta scaduta (timeout)');
        }

        const msg = error.message || 'Network error';
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
          throw new Error(
            lang === 'EN'
              ? 'Cannot connect to server. Ensure Node.js server is running on port 3000.'
              : 'Impossibile connettersi al server. Assicurati che il server Node.js sia in esecuzione sulla porta 3000.'
          );
        }
      }
      throw error;
    }
  };

  return { callAI };
};
