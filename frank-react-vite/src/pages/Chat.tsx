/**
 * Chat.tsx
 * -----------------------
 * AI chat interface in React + TypeScript
 * Handles user interactions, AI calls, debug panel, and reasoning panel.
 * Status updates are tracked with a single object { msg, status }.
 *
 * Author: Edoardo Sabatini
 * Date: 21 September 2025
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage, Provider, AIContext, AIStatus } from "../types/chat";
import Header from "../components/Header";
import MessageList from "../components/MessageList";
import InputBar from "../components/InputBar";
import DebugPanel from "../components/DebugPanel";
import ReasoningPanel from "../components/ReasoningPanel";
import { useServerHealth } from "../hooks/useServerHealth";
import { useAI } from "../hooks/useAI";
import { useAuthStore } from "../store/useAuthStore";
import { formatDateTime } from "../utils/datetime";

const Chat: React.FC = () => {
  // -----------------------------
  // Local state
  // -----------------------------
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [aiProvider, setAIProvider] = useState<Provider>("ollama");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAIPending, setIsAIPending] = useState(false);

  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState("");

  const [showReasoningPanel, setShowReasoningPanel] = useState(false);
  const [currentProcessingContext, setCurrentProcessingContext] = useState<
    AIContext | undefined
  >(undefined);

  // -----------------------------
  // Refs
  // -----------------------------
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastWelcomeLangRef = useRef<string | null>(null);

  // -----------------------------
  // Global store
  // -----------------------------
  const userLang = useAuthStore((state) => state.aIContext.system.userLang);
  const updateAIContext = useAuthStore((state) => state.updateAIContext);

  // -----------------------------
  // Debug logger
  // -----------------------------
  const appendDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  // -----------------------------
  // Type guard utility
  // -----------------------------
  function hasPropertyOfType<T>(
    data: unknown,
    propertyName: string,
    expectedType: "string" | "number" | "boolean" | "object"
  ): data is Record<string, T> {
    if (typeof data !== "object" || data === null) return false;
    const value = (data as Record<string, unknown>)[propertyName];
    switch (expectedType) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number";
      case "boolean":
        return typeof value === "boolean";
      case "object":
        return typeof value === "object" && value !== null;
      default:
        return false;
    }
  }

  // -----------------------------
  // AI status callback
  // -----------------------------
  const handleStatus = useCallback(
    (status: AIStatus) => {
      setAiStatus(status);
      const currentStoreContext = useAuthStore.getState().aIContext;

      // Handle form updates
      if (hasPropertyOfType<object>(status.data, "form", "object")) {
        const form = status.data.form;
        currentStoreContext.form = JSON.parse(JSON.stringify(form));
        updateAIContext(currentStoreContext);

        setCurrentProcessingContext((prev) =>
          prev ? { ...prev, form: JSON.parse(JSON.stringify(form)) } : prev
        );
      }

      // Handle booking system updates
      if (
        hasPropertyOfType<boolean>(
          status.data,
          "bookingSystemEnabled",
          "boolean"
        )
      ) {
        const bookingSystemEnabled = status.data.bookingSystemEnabled;
        const cancel = status.data.cancel;

        if (bookingSystemEnabled != null) {
          // Handle cancel
          if (cancel) {
            const resetForm = {
              tripDeparture: currentStoreContext.form.tripDeparture,
              tripDestination: "",
              dateTimeRoundTripDeparture: "",
              dateTimeRoundTripReturn: "",
              durationOfStayInDays: 0,
              travelMode: "",
              budget: 0,
              people: 0,
              starsOfHotel: 0,
              luggages: 0,
            };

            currentStoreContext.form = resetForm;
            status.status = "cancel";
            setAiStatus(status);

            setCurrentProcessingContext((prev) =>
              prev ? { ...prev, form: resetForm } : prev
            );
          }

          currentStoreContext.system.bookingSystemEnabled =
            bookingSystemEnabled;
          updateAIContext(currentStoreContext);

          setCurrentProcessingContext((prev) =>
            prev
              ? {
                  ...prev,
                  system: {
                    ...prev.system,
                    bookingSystemEnabled: bookingSystemEnabled,
                  },
                }
              : prev
          );
        }
      }
    },
    [updateAIContext]
  );

  // -----------------------------
  // Hooks for server health + AI
  // -----------------------------
  const serverStatus = useServerHealth(isDebugMode, appendDebugLog);
  const { callAI, stopAI } = useAI(aiProvider, apiKey, handleStatus);

  // -----------------------------
  // Scroll to bottom on new messages
  // -----------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // -----------------------------
  // Welcome message setup
  // -----------------------------
  useEffect(() => {
    const currentLang = userLang ?? "EN";
    if (lastWelcomeLangRef.current === currentLang) return;
    lastWelcomeLangRef.current = currentLang;

    const welcomeMessage =
      currentLang === "Italian"
        ? "Ciao! Sono il tuo assistente AI. Come posso aiutarti oggi?"
        : "Hello! I am your AI assistant. How can I help you today?";

    const storeSnapshot = useAuthStore.getState().aIContext;
    const welcomeSnapshot: AIContext = {
      ...storeSnapshot,
      input: "",
      output: welcomeMessage,
      system: {
        ...storeSnapshot.system,
        currentDateTime: formatDateTime(new Date()),
      },
    };

    updateAIContext(welcomeSnapshot);
    setChatMessages([
      {
        id: "welcome",
        type: "ai",
        timestamp: new Date(),
        aIContext: welcomeSnapshot,
      },
    ]);
  }, [userLang, updateAIContext]);

  // -----------------------------
  // Send message handler
  // -----------------------------
  async function handleSendMessage(passedText?: string): Promise<void> {
    const storeSnapshot = useAuthStore.getState().aIContext;
    const questionText = (passedText ?? storeSnapshot.input ?? "").trim();
    if (!questionText) return;

    const updatedSystem = {
      ...storeSnapshot.system,
      currentDateTime: formatDateTime(new Date()),
    };
    const contextForAI: AIContext = {
      ...storeSnapshot,
      system: updatedSystem,
      input: questionText,
      output: "?",
    };

    updateAIContext({ ...contextForAI, input: "", output: "?" });
    setShowReasoningPanel(true);
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "user",
        timestamp: new Date(),
        aIContext: contextForAI,
      },
    ]);

    // Reset state before call
    setAiStatus(null);
    setCurrentProcessingContext(contextForAI);
    setIsAIPending(true);

    try {
      const aiResponse = await callAI(contextForAI);
      updatedSystem.bookingSystemEnabled =
        aiResponse.system.bookingSystemEnabled;

      const aiSnapshot: AIContext = {
        system: updatedSystem,
        form: aiResponse.form ?? storeSnapshot.form,
        input: "",
        output: aiResponse.output ?? "?",
      };

      // If form is complete -> auto start booking process
      if (isFormComplete(aiSnapshot)) {
        aiSnapshot.system.bookingSystemEnabled = false;
        aiSnapshot.output =
          aiSnapshot.system.userLang === "Italian"
            ? "Processo di prenotazione avviato, attendere prego..."
            : "Booking process started, please wait...";
        aiSnapshot.output += printFormSnapshot(aiSnapshot);
      }

      setCurrentProcessingContext(aiSnapshot);
      updateAIContext(aiSnapshot);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_ai",
          type: "ai",
          timestamp: new Date(),
          aIContext: aiSnapshot,
        },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errSnapshot: AIContext = {
        ...storeSnapshot,
        system: updatedSystem,
        input: "",
        output: `Error: ${errorMessage}`,
      };
      updateAIContext(errSnapshot);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_err",
          type: "ai",
          timestamp: new Date(),
          aIContext: errSnapshot,
        },
      ]);
      appendDebugLog(`AI error: ${errorMessage}`);
      setCurrentProcessingContext(errSnapshot);
    } finally {
      setIsAIPending(false);
    }
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  function printFormSnapshot(aIContext: AIContext): string {
    const { form, system } = aIContext;
    if (system.userLang === "Italian") {
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
    - Departure date: ${formatDateTime(
      new Date(form.dateTimeRoundTripDeparture)
    )}
    - Return date: ${formatDateTime(new Date(form.dateTimeRoundTripReturn))}
    - Duration (days): ${form.durationOfStayInDays}
    - Travel mode: ${form.travelMode}
    - Budget: ${form.budget}
    - People: ${form.people}
    - Hotel stars: ${form.starsOfHotel}
    - Luggages: ${form.luggages}`;
    }
  }

  function isFormComplete(aIContext: AIContext): boolean {
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

  // -----------------------------
  // Chat reset
  // -----------------------------
  function handleClearChat() {
    const storeSnapshot = useAuthStore.getState().aIContext;
    const welcomeMessage =
      storeSnapshot.system.userLang === "Italian"
        ? "Ciao! Sono il tuo assistente AI. Come posso aiutarti oggi?"
        : "Hello! I am your AI assistant. How can I help you today?";

    const welcomeSnapshot: AIContext = {
      ...storeSnapshot,
      input: "",
      output: welcomeMessage,
      system: {
        ...storeSnapshot.system,
        currentDateTime: formatDateTime(new Date()),
      },
    };

    updateAIContext(welcomeSnapshot);
    setChatMessages([
      {
        id: "welcome",
        type: "ai",
        timestamp: new Date(),
        aIContext: welcomeSnapshot,
      },
    ]);

    setShowReasoningPanel(false);
    setCurrentProcessingContext(undefined);
    setAiStatus(null);

    inputRef.current?.focus();
    if (isDebugMode) appendDebugLog("Chat reset to welcome message.");
  }

  // -----------------------------
  // Stop AI
  // -----------------------------
  function handleStopAI() {
    setAiStatus(null);
    stopAI();
    setIsAIPending(false);
    inputRef.current?.focus();
    if (isDebugMode) appendDebugLog("AI stopped manually by user.");
  }

  // -----------------------------
  // Close reasoning panel
  // -----------------------------
  const handleCloseReasoningPanel = () => {
    handleStopAI();
    setShowReasoningPanel(false);

    const currentStoreContext = useAuthStore.getState().aIContext;
    const resetForm = {
      tripDeparture: currentStoreContext.form.tripDeparture,
      tripDestination: "",
      dateTimeRoundTripDeparture: "",
      dateTimeRoundTripReturn: "",
      durationOfStayInDays: 0,
      travelMode: "",
      budget: 0,
      people: 0,
      starsOfHotel: 0,
      luggages: 0,
    };

    const resetSystem = currentStoreContext.system;
    resetSystem.bookingSystemEnabled = false;

    const updatedContext: AIContext = {
      ...currentStoreContext,
      form: resetForm,
      system: resetSystem,
    };

    useAuthStore.getState().updateAIContext(updatedContext);
  };

  // -----------------------------
  // Render
  // -----------------------------
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
          stopAI={handleStopAI}
        />
      </div>

      <ReasoningPanel
        isVisible={showReasoningPanel}
        isProcessing={isAIPending}
        currentContext={currentProcessingContext}
        onClose={handleCloseReasoningPanel}
        aiStatus={aiStatus || ({} as AIStatus)}
      />
    </div>
  );
};

export default Chat;
