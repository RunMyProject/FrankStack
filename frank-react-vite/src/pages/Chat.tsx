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
 * Date: 29 August 2025
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Lang, Provider } from '../types/chat';
import Header from '../components/Header';
import MessageList from '../components/MessageList';
import InputBar from '../components/InputBar';
import DebugPanel from '../components/DebugPanel';
import { useServerHealth } from '../hooks/useServerHealth';
import { useAI } from '../hooks/useAI';
import { buildAIContext } from '../utils/contextBuilder';

const Chat: React.FC = () => {
  // ----- State management -----
  const [aiProvider, setAIProvider] = useState<Provider>('ollama');
  const [chatLanguage, setChatLanguage] = useState<Lang>('IT');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAIPending, setIsAIPending] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('');

  // ----- Refs -----
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userInputRef = useRef<HTMLInputElement>(null);

  // ----- User / AI configuration -----
  const aiName = '🤖 FrankStack AI Assistant';
  const serverStatus = useServerHealth(isDebugMode, appendDebugLog);
  const { callAI } = useAI(aiProvider, apiKey, isDebugMode, appendDebugLog, chatLanguage);

  // ----- Effects -----
  useEffect(() => {
    // Auto-scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    // Initialize welcome message based on selected language
    const welcomeMessage = chatLanguage === 'IT'
      ? 'Ciao! Sono il tuo assistente AI. Come posso aiutarti oggi?'
      : 'Hello! I am your AI assistant. How can I help you today?';
    setChatMessages([{ id: 'welcome', type: 'ai', content: welcomeMessage, timestamp: new Date() }]);
  }, [chatLanguage]);

  // ----- Helper functions -----
  function appendDebugLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }

  async function handleSendMessage(): Promise<void> {
    if (!userInput.trim()) return;
    const finalMessage = buildAIContext(aiName, userInput);

    // Append user message
    setChatMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      type: 'user', 
      content: userInput, 
      timestamp: new Date() 
    }]);
    setUserInput('');
    setIsAIPending(true);

    try {
      const aiResponse = await callAI(finalMessage);

      // ✅ Parse JSON, fallback if invalid
      let parsedAnswer = aiResponse;
      try {
        const parsed = JSON.parse(aiResponse);
        if (parsed.answer) {
          parsedAnswer = parsed.answer;
        }
      } catch (e) {
        if (e instanceof Error) console.warn("AI response not valid JSON. Falling back to raw text.");
      }

      setChatMessages(prev => [...prev, { 
        id: Date.now().toString() + '_ai', 
        type: 'ai', 
        content: parsedAnswer, 
        timestamp: new Date() 
      }]);
    } catch (error) {
      if (error instanceof Error) {
        setChatMessages(prev => [...prev, { 
          id: Date.now().toString() + '_err', 
          type: 'ai', 
          content: `Error: ${error.message}`, 
          timestamp: new Date() 
        }]);
      }
    } finally {
      setIsAIPending(false);
    }
  }

  function handleClearChat() {
    // Reset chat to welcome message
    const welcomeMessage = chatLanguage === 'IT'
      ? 'Ciao! Sono il tuo assistente AI. Come posso aiutarti oggi?'
      : 'Hello! I am your AI assistant. How can I help you today?';
    setChatMessages([{ id: 'welcome', type: 'ai', content: welcomeMessage, timestamp: new Date() }]);
    userInputRef.current?.focus();
    if (isDebugMode) appendDebugLog('Chat reset to welcome message.');
  }

  // ----- Render -----
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex justify-center items-center p-5">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header with controls for language, provider, server status, weather, API key, debug */}
        <Header
          currentLang={chatLanguage}
          setCurrentLang={setChatLanguage}
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
          currentMessage={userInput}
          setCurrentMessage={setUserInput}
          sendMessage={handleSendMessage}
          clearChat={handleClearChat}
          isLoading={isAIPending}
        />
      </div>
    </div>
  );
};

export default Chat;
