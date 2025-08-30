/**
 * Chat.tsx
 * Chat Component
 * -----------------------
 * A responsive AI chat interface built with React, TypeScript, and custom hooks.
 * Features:
 * - Dynamic AI provider selection (default: 'ollama')
 * - Language switching (Italian / English)
 * - Weather-aware AI context
 * - Server health monitoring
 * - Debug panel for detailed logs
 * - Maximum words control for AI responses
 * 
 * Note: Italian texts inside the chat flow remain hardcoded by design.
 * 
 * Author: Edoardo Sabatini
 * Date: 30 August 2025
 */

// Chat.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, Provider } from '../types/chat';
import Header from '../components/Header';
import MessageList from '../components/MessageList';
import InputBar from '../components/InputBar';
import DebugPanel from '../components/DebugPanel';
import { useServerHealth } from '../hooks/useServerHealth';
import { useAI } from '../hooks/useAI';
import { useAuthStore } from '../store/useAuthStore';
import { formatDateTime } from '../utils/datetime';

const Chat: React.FC = () => {
  // ----- State management -----
  const [aiProvider, setAIProvider] = useState<Provider>('ollama');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAIPending, setIsAIPending] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('');

  // ----- Refs -----
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userInputRef = useRef<HTMLInputElement>(null);
  const lastWelcomeLangRef = useRef<string | null>(null);

  // ----- Auth store selectors (minimizza ri-render) -----
  const userLang = useAuthStore(state => state.aIContext.userLang);
  const updateAIContext = useAuthStore(state => state.updateAIContext);

  // ----- Helper: append debug log (stable identity) -----
  const appendDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  // ----- Server health & AI hook (usano appendDebugLog) -----
  const serverStatus = useServerHealth(isDebugMode, appendDebugLog);
  const { callAI } = useAI(aiProvider, apiKey, isDebugMode, appendDebugLog);

  // ----- Effects -----
  useEffect(() => {
    // Auto-scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Welcome message effect — idempotente e ESLint-friendly:
  useEffect(() => {
    const currentLang = userLang ?? 'EN';

    // evita esecuzioni ripetute (utile anche con StrictMode)
    if (lastWelcomeLangRef.current === currentLang) return;
    lastWelcomeLangRef.current = currentLang;

    const welcomeMessage = currentLang === 'IT'
      ? 'Ciao! Sono il tuo assistente AI. Come posso aiutarti oggi?'
      : 'Hello! I am your AI assistant. How can I help you today?';

    // aggiorna solo la proprietà question nella store
    updateAIContext({ question: '', answer: "*" });

    // prendi snapshot attuale dalla store (non crea dipendenze)
    const currentStoreSnapshot = useAuthStore.getState().aIContext;
    const welcomeSnapshot = { ...currentStoreSnapshot, question: '', answer: welcomeMessage, userLang: currentLang };

    // imposta welcome message una volta
    setChatMessages([{ id: 'welcome', type: 'ai', timestamp: new Date(), aIContext: welcomeSnapshot }]);
  }, [userLang, updateAIContext]);

  // ----- Helper functions -----
  // handleSendMessage accetta testo (passato dall'InputBar) o legge dalla store se non fornito
  async function handleSendMessage(passedText?: string): Promise<void> {
      
      // Clear the input immediately by updating store
      updateAIContext({ currentDateTime: formatDateTime(new Date()), answer: "*" });

      const storeSnapshot = useAuthStore.getState().aIContext;
      const questionText = (passedText ?? storeSnapshot.question ?? '').trim();
      if (!questionText) return;

      // Snapshot per UI basato sullo snapshot corrente
      const userSnapshot = { ...storeSnapshot, question: questionText };

      // Clear the input immediately by updating store
      updateAIContext({ question: "" });

      setChatMessages(prev => [
        ...prev,
        { id: Date.now().toString(), type: 'user', timestamp: new Date(), aIContext: userSnapshot }
      ]);

      setIsAIPending(true);
      try {
        const aIContextResponse = await callAI(userSnapshot);
        
        // *** FIX: assicurati che la risposta AI abbia il campo 'answer' ***
        const aiResponseSnapshot = {
          ...storeSnapshot,
          ...aIContextResponse,
          question: '', // mantieni question vuoto dopo la risposta
        };
        
        // aggiorna la store con la risposta completa ricevuta
        updateAIContext(aiResponseSnapshot);

        setChatMessages(prev => [
          ...prev,
          { 
            id: Date.now().toString() + '_ai', 
            type: 'ai', 
            timestamp: new Date(), 
            aIContext: aiResponseSnapshot // usa la risposta completa
          }
        ]);
      } catch (error) {
        const err = error instanceof Error ? error.message : String(error);
        const errSnapshot = { 
          ...storeSnapshot, 
          question: '', // pulisci anche in caso di errore
          answer: `Error: ${err}` // l'errore va nell'answer, non nella question
        };
        updateAIContext(errSnapshot);
        setChatMessages(prev => [
          ...prev,
          { id: Date.now().toString() + '_err', type: 'ai', timestamp: new Date(), aIContext: errSnapshot }
        ]);
        appendDebugLog(`AI error: ${err}`);
      } finally {
        setIsAIPending(false);
      }
  }

  // -----------------   handleClearChat ---
  function handleClearChat() {
    const storeSnapshot = useAuthStore.getState().aIContext;
    const welcomeMessage = storeSnapshot.userLang === 'IT'
      ? 'Ciao! Sono il tuo assistente AI. Come posso aiutarti oggi?'
      : 'Hello! I am your AI assistant. How can I help you today?';

    updateAIContext({ question: welcomeMessage });
    const welcomeSnapshot = { ...storeSnapshot, question: welcomeMessage };

    setChatMessages([{ id: 'welcome', type: 'ai', timestamp: new Date(), aIContext: welcomeSnapshot }]);
    userInputRef.current?.focus();
    if (isDebugMode) appendDebugLog('Chat reset to welcome message.');
  }

  // ----- Render -----
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex justify-center items-center p-5">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <Header
          currentProvider={aiProvider}
          setCurrentProvider={setAIProvider}
          serverStatus={serverStatus}
          apiKey={apiKey}
          setApiKey={setApiKey}
          toggleDebug={() => setIsDebugMode(!isDebugMode)}
          debugMode={isDebugMode}
        />
        <MessageList
          messages={chatMessages}
          isLoading={isAIPending}
          messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
        />
        {isDebugMode && <DebugPanel logs={debugLogs} />}
        <InputBar
          messageInputRef={userInputRef as React.RefObject<HTMLInputElement>}
          sendMessage={handleSendMessage}
          clearChat={handleClearChat}
          isLoading={isAIPending}
        />
      </div>
    </div>
  );
};

export default Chat;
