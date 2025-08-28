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
 * Italian “cablati” texts are preserved as-is.
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Lang, Provider } from '../types/chat';
import Header from '../components/Header';
import MessageList from '../components/MessageList';
import InputBar from '../components/InputBar';
import DebugPanel from '../components/DebugPanel';
import { useWeather } from '../hooks/useWeather';
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
  const [maxResponseWords, setMaxResponseWords] = useState(50);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('');

  // ----- Refs -----
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userInputRef = useRef<HTMLInputElement>(null);

  // ----- User / AI configuration -----
  const userName = 'Edoardo';
  const aiName = '🤖 FrankStack AI Assistant';
  const locationName = chatLanguage === 'IT' ? 'Milano' : 'Milan';
  const latitude = 45.4642;
  const longitude = 9.19;

  // ----- Custom hooks -----
  const weatherData = useWeather(latitude, longitude, chatLanguage);
  const serverStatus = useServerHealth(isDebugMode, appendDebugLog);
  const { callAI } = useAI(aiProvider, apiKey, isDebugMode, appendDebugLog, chatLanguage);

  // ----- Effects -----
  useEffect(() => {
    // Scroll chat to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    // Initialize welcome message based on language
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
    const aiContext = buildAIContext(maxResponseWords, aiName, locationName, weatherData, userName);
    const finalMessage = aiContext + userInput;

    // Append user message
    setChatMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content: userInput, timestamp: new Date() }]);
    setUserInput('');
    setIsAIPending(true);

    try {
      const aiResponse = await callAI(finalMessage);
      setChatMessages(prev => [...prev, { id: Date.now().toString() + '_ai', type: 'ai', content: aiResponse, timestamp: new Date() }]);
    } catch (error) {
      if (error instanceof Error) {
        setChatMessages(prev => [...prev, { id: Date.now().toString() + '_err', type: 'ai', content: `Errore: ${error.message}`, timestamp: new Date() }]);
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
          userName={userName}
          locationName={locationName}
          currentLang={chatLanguage}
          setCurrentLang={setChatLanguage}
          currentProvider={aiProvider}
          setCurrentProvider={setAIProvider}
          serverStatus={serverStatus}
          weather={weatherData}
          apiKey={apiKey}
          setApiKey={setApiKey}
          toggleDebug={() => setIsDebugMode(!isDebugMode)}
          debugMode={isDebugMode}
        />
        <MessageList messages={chatMessages} isLoading={isAIPending} currentLang={chatLanguage} messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>} />
        {isDebugMode && <DebugPanel logs={debugLogs} />}
        <InputBar
          messageInputRef={userInputRef as React.RefObject<HTMLInputElement>}
          currentMessage={userInput}
          setCurrentMessage={setUserInput}
          sendMessage={handleSendMessage}
          clearChat={handleClearChat}
          isLoading={isAIPending}
          currentLang={chatLanguage}
          maxWords={maxResponseWords}
          setMaxWords={setMaxResponseWords}
        />
      </div>
    </div>
  );
};

export default Chat;
