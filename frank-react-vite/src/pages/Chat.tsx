/**
 * Chat.tsx
 * -----------------------
 * AI chat interface in React + TypeScript
 * Uses structured AIContext: system (fisso) + form (compilabile)
 * 
 * Author: Edoardo Sabatini
 * Date: 31 August 2025
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, Provider, AIContext } from '../types/chat';
import Header from '../components/Header';
import MessageList from '../components/MessageList';
import InputBar from '../components/InputBar';
import DebugPanel from '../components/DebugPanel';
import { useServerHealth } from '../hooks/useServerHealth';
import { useAI } from '../hooks/useAI';
import { useAuthStore } from '../store/useAuthStore';
import { formatDateTime } from '../utils/datetime';

const Chat: React.FC = () => {
  const [aiProvider, setAIProvider] = useState<Provider>('ollama');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAIPending, setIsAIPending] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastWelcomeLangRef = useRef<string | null>(null);

  const userLang = useAuthStore(state => state.aIContext.system.userLang);
  const updateAIContext = useAuthStore(state => state.updateAIContext);

  const appendDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const serverStatus = useServerHealth(isDebugMode, appendDebugLog);
  const { callAI } = useAI(aiProvider, apiKey);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const currentLang = userLang ?? 'EN';
    if (lastWelcomeLangRef.current === currentLang) return;
    lastWelcomeLangRef.current = currentLang;

    const welcomeMessage = currentLang === 'Italian'
      ? 'Ciao! Sono il tuo assistente AI. Come posso aiutarti oggi?'
      : 'Hello! I am your AI assistant. How can I help you today?';

    const storeSnapshot = useAuthStore.getState().aIContext;
    const welcomeSnapshot: AIContext = {
      ...storeSnapshot,
      input: '',
      output: welcomeMessage,
      system: { ...storeSnapshot.system, currentDateTime: formatDateTime(new Date()) }
    };

    updateAIContext(welcomeSnapshot);
    setChatMessages([{ id: 'welcome', type: 'ai', timestamp: new Date(), aIContext: welcomeSnapshot }]);
  }, [userLang, updateAIContext]);

  async function handleSendMessage(passedText?: string): Promise<void> {
    const storeSnapshot = useAuthStore.getState().aIContext;
    const questionText = (passedText ?? storeSnapshot.input ?? '').trim();
    if (!questionText) return;

    const updatedSystem = { ...storeSnapshot.system, currentDateTime: formatDateTime(new Date()) };
    const contextForAI: AIContext = {
      ...storeSnapshot,
      system: updatedSystem,
      input: questionText,
      output: '?'
    };

    updateAIContext({ ...contextForAI, input: '', output: '?' });

    setChatMessages(prev => [
      ...prev,
      { id: Date.now().toString(), type: 'user', timestamp: new Date(), aIContext: contextForAI }
    ]);

    setIsAIPending(true);
    try {
        const aiResponse = await callAI(contextForAI);
        updatedSystem.bookingSystemEnabled = aiResponse.system.bookingSystemEnabled;
      
        const aiSnapshot: AIContext = {
          system: updatedSystem,
          form: aiResponse.form ?? storeSnapshot.form,
          input: '',
          output: aiResponse.output ?? '?'
        };

        if(isFormComplete(aiSnapshot)) {
          aiSnapshot.system.bookingSystemEnabled = false;
          aiSnapshot.output = aiSnapshot.system.userLang === 'Italian'
            ? 'Processo di prenotazione avviato, attendere prego...'
            : 'Booking process started, please wait...';
          aiSnapshot.output += printFormSnapshot(aiSnapshot);
        }

      updateAIContext(aiSnapshot);
      setChatMessages(prev => [
        ...prev,
        { id: Date.now().toString() + '_ai', type: 'ai', timestamp: new Date(), aIContext: aiSnapshot }
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errSnapshot: AIContext = { ...storeSnapshot, system: updatedSystem, input: '', output: `Error: ${errorMessage}` };
      updateAIContext(errSnapshot);
      setChatMessages(prev => [
        ...prev,
        { id: Date.now().toString() + '_err', type: 'ai', timestamp: new Date(), aIContext: errSnapshot }
      ]);
      appendDebugLog(`AI error: ${errorMessage}`);
    } finally {
      setIsAIPending(false);
    }
  }

  function printFormSnapshot(aIContext : AIContext): string {
      const { form, system } = aIContext;

      if (system.userLang === 'Italian') {
        return `📋 Dati viaggio:
    - Partenza: ${form.tripDeparture}
    - Destinazione: ${form.tripDestination}
    - Data andata: ${formatDateTime(new Date(form.dateTimeRoundTripDeparture))}
    - Data ritorno: ${formatDateTime(new Date(form.dateTimeRoundTripReturn))}
    - Durata soggiorno (giorni): ${form.durationOfStayInDays}
    - Mezzo di trasporto: ${form.travelMode}
    - Budget: ${form.budget}
    - Persone: ${form.people}
    - Stelle hotel: ${form.starsOfHotel}
    - Valigie: ${form.luggages}`;
      } else {
        return `📋 Trip data:
    - Departure: ${form.tripDeparture}
    - Destination: ${form.tripDestination}
    - Departure date: ${formatDateTime(new Date(form.dateTimeRoundTripDeparture))}
    - Return date: ${formatDateTime(new Date(form.dateTimeRoundTripReturn))}
    - Duration (days): ${form.durationOfStayInDays}
    - Travel mode: ${form.travelMode}
    - Budget: ${form.budget}
    - People: ${form.people}
    - Hotel stars: ${form.starsOfHotel}
    - Luggages: ${form.luggages}`;
      }
  }

  function isFormComplete(aIContext : AIContext): boolean {    
    const form = aIContext.form;
    const isNonEmptyString = (s: string | "") =>
    typeof s === "string" && s.trim() !== "" && s !== '""';

  return (
    isNonEmptyString(form.tripDeparture) &&
    isNonEmptyString(form.tripDestination) &&
    isNonEmptyString(form.dateTimeRoundTripDeparture) &&
    isNonEmptyString(form.dateTimeRoundTripReturn) &&
    form.durationOfStayInDays > 0 &&
    isNonEmptyString(form.travelMode) &&
    form.budget > 0 &&
    form.people > 0 &&
    form.starsOfHotel > 0 &&
    form.luggages > 0
  );
}

  function handleClearChat() {
    const storeSnapshot = useAuthStore.getState().aIContext;
    const welcomeMessage = storeSnapshot.system.userLang === 'Italian'
      ? 'Ciao! Sono il tuo assistente AI. Come posso aiutarti oggi?'
      : 'Hello! I am your AI assistant. How can I help you today?';

    const welcomeSnapshot: AIContext = { ...storeSnapshot, input: '', output: welcomeMessage, system: { ...storeSnapshot.system, currentDateTime: formatDateTime(new Date()) } };
    updateAIContext(welcomeSnapshot);
    setChatMessages([{ id: 'welcome', type: 'ai', timestamp: new Date(), aIContext: welcomeSnapshot }]);
    inputRef.current?.focus();
    if (isDebugMode) appendDebugLog('Chat reset to welcome message.');
  }

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
          messageInputRef={inputRef as React.RefObject<HTMLInputElement>}
          sendMessage={handleSendMessage}
          clearChat={handleClearChat}
          isLoading={isAIPending}
        />
      </div>
    </div>
  );
};

export default Chat;
