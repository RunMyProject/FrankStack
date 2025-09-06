/**
 * useAI.ts
 * AI Hook for Chat Requests (Fixed & Compatible)
 * -----------------------
 * - Compatibile con il server mistral-server.js modificato
 * - Gestisce correttamente response.response structure
 * - Debug logging migliorato
 * - Fallback sicuri per answer e form
 *
 * Author: Assistant (adapted for Edoardo)
 * Date: 1 September 2025
 */

import type { AIContext, Provider, AIRequestPayload } from '../types/chat';

interface ServerResponse {
  response: AIContext;
  debug?: {
    rawOutput: string;
    cleanedJSON: string;
    timestamp: string;
    model: string;
  };
  error?: string;
}

export const useAI = (provider: Provider, apiKey: string) => {
  const serverUrl = 'http://localhost:3000';
  const TIMEOUT_MS = 600000; // 10 minuti

  const callAI = async (aIContext: AIContext): Promise<AIContext> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Inizializza answer a fallback
    aIContext.output = '';


    const payload: AIRequestPayload = {
      aIContext: aIContext,
      provider,
      ...(provider === 'chatgpt' ? { apiKey } : {})
    };

    if (provider === 'chatgpt' && (!apiKey || !apiKey.trim())) {
      clearTimeout(timeout);
      throw new Error('API Key richiesta per ChatGPT');
    }

    console.log('🚀 SENDING TO SERVER:', {
      url: `${serverUrl}/chat`,
      payload: payload
    });

    try {
      const res = await fetch(`${serverUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ SERVER ERROR:', errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const serverResponse: ServerResponse = await res.json();
      
      console.log('📥 SERVER RESPONSE:' + JSON.stringify(serverResponse));

      // Se c'è un errore nel server response
      if (serverResponse.error) {
        throw new Error(serverResponse.error);
      }

      // Il server ora restituisce { response: AIContext, debug?: ... }
      const aiResponse = serverResponse.response;

      if (!aiResponse) {
        throw new Error('Server response missing "response" field');
      }

      // Log debug info se disponibile
      if (serverResponse.debug) {
        console.log('🔍 DEBUG INFO:', serverResponse.debug);
      }

      return aiResponse;

    } catch (error: unknown) {
      clearTimeout(timeout);
      console.error('💥 ERROR IN useAI:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Richiesta scaduta (timeout)');
        }
        throw error;
      }
      throw new Error('Errore sconosciuto');
    }
  };

  return { callAI };
};