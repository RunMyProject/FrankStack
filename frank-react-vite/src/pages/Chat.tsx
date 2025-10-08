/**
 * Chat.tsx
 * -----------------------
 * AI chat interface in React + TypeScript
 * Handles user interactions, AI calls, debug panel, and reasoning panel.
 * Status updates are tracked with a single object { msg, status }.
 *
 * Author: Edoardo Sabatini
 * Date: 08 October 2025
 */

// ===========================================
// 🧪 TEST MODE CONFIGURATION
// ===========================================
const ENABLE_TEST_MODE = false; // Set to false to disable test mode
// ===========================================

// ===========================================
// 🧪 TEST DATA
// ===========================================

const TEST_BOOKING_DATA: AIContext = {
  system: {
    maxWords: 50,
    user: "testUser",
    userLang: "English",
    aiName: "FrankStack AI Assistant",
    currentDateTime: "24/09/2025 00:00",
    weather: "Sunny",
    temperatureWeather: 22,
    bookingSystemEnabled: true
  },
  form: {
    tripDeparture: "Milan",
    tripDestination: "Paris",
    dateTimeRoundTripDeparture: "2025-09-24T00:00:00Z",
    dateTimeRoundTripReturn: "2025-09-28T00:00:00Z",
    durationOfStayInDays: 4,
    travelMode: "plane",
    budget: 1000,
    people: 2,
    starsOfHotel: 3,
    luggages: 2
  },
  input: "",
  output: "🧪 Starting a booking test..."
};


/*
const TEST_BOOKING_DATA: AIContext = {
  system: {
    maxWords: 50,
    user: "testUser",
    userLang: "Italian",
    aiName: "FrankStack AI Assistant",
    currentDateTime: "24/09/2025 00:00",
    weather: "Sunny",
    temperatureWeather: 22,
    bookingSystemEnabled: true
  },
  form: {
    tripDeparture: "Milano",
    tripDestination: "Parigi",
    dateTimeRoundTripDeparture: "2025-09-24T00:00:00Z",
    dateTimeRoundTripReturn: "2025-09-28T00:00:00Z",
    durationOfStayInDays: 4,
    travelMode: "plane",
    budget: 1000,
    people: 2,
    starsOfHotel: 3,
    luggages: 2
  },
  input: "",
  output: "🧪 Starting a booking test..."
};
*/

// Base
import React, { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage, Provider, AIContext, AIStatus, ProcessResult } from "../types/chat";

// Components
import Header from "../components/Header";
import MessageList from "../components/MessageList";
import InputBar from "../components/InputBar";
import DebugPanel from "../components/DebugPanel";
import ReasoningPanel from "../components/ReasoningPanel";
import BookingConfirmDialog from "../components/BookingConfirmDialog";
import BookingProcessDialog from "../components/BookingProcessDialog";

// Miscellaneous
import { useServerHealth } from "../hooks/useServerHealth";
import { useAI } from "../hooks/useAI";
import { useAuthStore } from "../store/useAuthStore";
import { formatDateTime } from "../utils/datetime";
import { sagaManager } from "../utils/BookingSagaManager";

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

  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [sagaTransactionId, setSagaTransactionId] = useState<string | null>(null);

  // -----------------------------
  // Booking dialog state
  // -----------------------------
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingContext, setBookingContext] = useState<AIContext | null>(null);

  // -----------------------------
  // Test mode state
  // -----------------------------
  const [testModeActivated, setTestModeActivated] = useState(false);

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
  // Test Mode Functions
  // -----------------------------
  const formatElegantDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `📅 ${date} ⏰ ${time}`;
  };

  const getTransportIcon = (mode?: string): string => {
    if (!mode) return "—";
    switch (mode.toLowerCase()) {
      case "plane":
      case "flight":
      case "airplane":
        return "✈️";
      case "train":
        return "🚆";
      case "bus":
        return "🚌";
      case "car":
        return "🚗";
      default:
        return "❓";
    }
  };

  const renderWithIcons = (value: number, icon: string, maxReal: number): string => {
    if (value <= 0) return "—";
    const limited = Math.min(value, maxReal);
    return limited > 3 ? `${icon.repeat(3)} (${limited})` : icon.repeat(limited);
  };

  const generateTestSummary = (context: AIContext): string => {
    const { form } = context;
    const transportIcon = getTransportIcon(form.travelMode);
    
    return `🧪 Avvio di test di prenotazione in corso...

📋 Riepilogo Viaggio:
• Partenza: ${form.tripDeparture}
• Destinazione: ${form.tripDestination}
• Data andata: ${formatElegantDate(form.dateTimeRoundTripDeparture)}
• Data ritorno: ${formatElegantDate(form.dateTimeRoundTripReturn)}
• Giorni: ${form.durationOfStayInDays}
• Trasporto: ${transportIcon}
• Budget: €${form.budget}
• Persone: ${renderWithIcons(form.people, "👤", 10)}
• Stelle Hotel: ${renderWithIcons(form.starsOfHotel, "⭐", 7)}
• Bagagli: ${renderWithIcons(form.luggages, "🧳", 10)}

🚀 Avvio del processo Saga...`;
  };

  const activateTestMode = useCallback((force: boolean) => {
    if(!force) if (!ENABLE_TEST_MODE || testModeActivated) return;

    console.log("🧪 Attivazione Test Mode");
    setTestModeActivated(true);

    // Update context with test data
    const testContext: AIContext = {
      ...TEST_BOOKING_DATA,
      system: {
        ...TEST_BOOKING_DATA.system,
        currentDateTime: formatDateTime(new Date()),
        userLang: userLang || "Italian"
      },
      output: generateTestSummary(TEST_BOOKING_DATA)
    };

    updateAIContext(testContext);

    // Add test message to chat
    const testMessage: ChatMessage = {
      id: "test-booking-" + Date.now(),
      type: "ai",
      timestamp: new Date(),
      aIContext: testContext
    };

    setChatMessages(prev => [...prev, testMessage]);

    // Directly activate booking process dialog
    setTimeout(() => {
      setBookingContext(testContext);
      setShowProcessDialog(true);
      
      // Start saga transaction
      startTestSagaTransaction(testContext);
    }, 1500); // Small delay to let user see the summary

  }, [ENABLE_TEST_MODE, testModeActivated, userLang, updateAIContext]);

  const startTestSagaTransaction = async (context: AIContext) => {
    try {
      console.log("🚀 Starting test saga transaction");
      
      const transactionId = await sagaManager.startSagaTransaction(
        context,
        (step: string, status: string, data?: unknown) => {
          console.log(`🔄 Saga step update: ${step} -> ${status}`, data);
        }
      );
      
      setSagaTransactionId(transactionId);
      appendDebugLog(`Test saga started with ID: ${transactionId}`);
      
    } catch (error) {
      console.error('❌ Test saga transaction failed:', error);
      appendDebugLog(`Test saga error: ${error}`);
    }
  };

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
  // Welcome message setup + TEST MODE ACTIVATION
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

    // 🧪 ACTIVATE TEST MODE AFTER WELCOME MESSAGE
    if (ENABLE_TEST_MODE && !testModeActivated) {
      setTimeout(activateTestMode, 2000); // 2 second delay after welcome
    }
  }, [userLang, updateAIContext, activateTestMode, testModeActivated]);

  // -----------------------------
  // Send message handler
  // -----------------------------
  async function handleSendMessage(passedText?: string): Promise<void> {
    // Skip normal message handling if test mode is active
    if (ENABLE_TEST_MODE) {
      console.log("🧪 Test mode active - skipping normal message handling");
      activateTestMode(true);
      return;
    }

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

      // NEW: If form is complete -> show booking dialog instead of auto-booking
      if (isFormComplete(aiSnapshot)) {
        aiSnapshot.system.bookingSystemEnabled = true; // Keep booking mode active
        setBookingContext(aiSnapshot);
        setShowBookingDialog(true);
        setShowReasoningPanel(false); // Hide reasoning panel when showing booking dialog
        
        // Don't add a message yet - wait for user decision
        setCurrentProcessingContext(aiSnapshot);
        updateAIContext(aiSnapshot);
        return;
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
  // Booking dialog handlers
  // -----------------------------
  const handleBookingConfirm = async () => {
    if (!bookingContext) return;
    
    setShowBookingDialog(false);
    setShowProcessDialog(true);
    
    try {
      const transactionId = await sagaManager.startSagaTransaction(
        bookingContext,
        (step: string, status: string, data?: unknown) => {
          // This callback will be handled by the BookingProcessDialog
          console.log(`Saga step update: ${step} -> ${status}`, data);
        }
      );
      
      setSagaTransactionId(transactionId);
      
    } catch (error) {
      console.error('Saga transaction failed:', error);
      setShowProcessDialog(false);
      
      const errorMessage = bookingContext.system.userLang === "Italian"
        ? `❌ Errore durante la prenotazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
        : `❌ Booking error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      const errorSnapshot: AIContext = { 
        ...bookingContext, 
        output: errorMessage,
        system: { ...bookingContext.system, bookingSystemEnabled: false }
      };
      
      updateAIContext(errorSnapshot);
      setChatMessages(prev => [...prev, { 
        id: Date.now() + "_error", 
        type: "ai", 
        timestamp: new Date(), 
        aIContext: errorSnapshot 
      }]);
    }
  };

  const handleBookingCancel = () => {
    if (!bookingContext) return;
    const message = bookingContext.system.userLang === "Italian"
      ? "❌ Prenotazione annullata. Come posso aiutarti?" : "❌ Booking cancelled. How can I help you?";
    
    const snapshot: AIContext = { ...useAuthStore.getState().aIContext, 
      form: { tripDeparture: "", tripDestination: "", dateTimeRoundTripDeparture: "", dateTimeRoundTripReturn: "", 
        durationOfStayInDays: 0, travelMode: "", budget: 0, people: 0, starsOfHotel: 0, luggages: 0 },
      output: message, system: { ...useAuthStore.getState().aIContext.system, bookingSystemEnabled: false }};
    
    updateAIContext(snapshot);
    setChatMessages(prev => [...prev, { id: Date.now() + "_cancel", type: "ai", timestamp: new Date(), aIContext: snapshot }]);
    setShowBookingDialog(false);
    setBookingContext(null);
    setShowReasoningPanel(false);
  };

  const handleBookingModify = (modificationRequest: string) => {
    setShowBookingDialog(false);
    setBookingContext(null);
    handleSendMessage(modificationRequest);
  };

  const handleBookingClose = () => {
    // Simply close dialog without any action
    setShowBookingDialog(false);
    setBookingContext(null);
  };

  // -----------------------------
  // Helpers
  // -----------------------------
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
    const context = useAuthStore.getState().aIContext;
    const resetForm = { tripDeparture: context.form.tripDeparture, tripDestination: "", dateTimeRoundTripDeparture: "", 
      dateTimeRoundTripReturn: "", durationOfStayInDays: 0, travelMode: "", budget: 0, people: 0, starsOfHotel: 0, luggages: 0 };
    useAuthStore.getState().updateAIContext({ ...context, form: resetForm, system: { ...context.system, bookingSystemEnabled: false }});
  };

  // -----------------------------
  // process dialog handlers
  // -----------------------------
  const handleProcessComplete = (result: ProcessResult) => {
    setSagaTransactionId(null);
    
    if (!bookingContext) return;
    
    const successMessage = result.message || (
      bookingContext.system.userLang === "Italian" 
        ? "🎉 Prenotazione completata con successo!" 
        : "🎉 Booking completed successfully!"
    );
    
    const successSnapshot: AIContext = { 
      ...bookingContext, 
      output: successMessage,
      system: { ...bookingContext.system, bookingSystemEnabled: false }
    };
    
    updateAIContext(successSnapshot);
    setChatMessages(prev => [...prev, { 
      id: Date.now() + "_success", 
      type: "ai", 
      timestamp: new Date(), 
      aIContext: successSnapshot 
    }]);
  
    // Reset form after successful booking
    const resetForm = { 
      tripDeparture: "", tripDestination: "", dateTimeRoundTripDeparture: "", 
      dateTimeRoundTripReturn: "", durationOfStayInDays: 0, travelMode: "", 
      budget: 0, people: 0, starsOfHotel: 0, luggages: 0 
    };
    
    const finalSnapshot = { ...successSnapshot, form: resetForm };
    updateAIContext(finalSnapshot);

    // Close process dialog after completion
    /*
    setTimeout(() => {
      setShowProcessDialog(false);
    }, 3000);
    */
  };

  const handleProcessError = (error: string) => {
    // setShowProcessDialog(false);
    setSagaTransactionId(null);
    
    if (!bookingContext) return;
    
    const errorMessage = bookingContext.system.userLang === "Italian"
      ? `❌ Errore durante il processo: ${error}`
      : `❌ Process error: ${error}`;
    
    const errorSnapshot: AIContext = { 
      ...bookingContext, 
      output: errorMessage,
      system: { ...bookingContext.system, bookingSystemEnabled: false }
    };
    
    updateAIContext(errorSnapshot);
    setChatMessages(prev => [...prev, { 
      id: Date.now() + "_process_error", 
      type: "ai", 
      timestamp: new Date(), 
      aIContext: errorSnapshot 
    }]);
  };

  const handleProcessClose = () => {
    if (sagaTransactionId) {
      sagaManager.cancelTransaction(sagaTransactionId);
    }
    
    setShowProcessDialog(false);
    setSagaTransactionId(null);
    
    if (!bookingContext) return;
    
    const cancelMessage = bookingContext.system.userLang === "Italian"
      ? "❌ Processo di prenotazione interrotto."
      : "❌ Booking process cancelled.";
    
    const cancelSnapshot: AIContext = { 
      ...bookingContext, 
      output: cancelMessage,
      system: { ...bookingContext.system, bookingSystemEnabled: false }
    };
    
    updateAIContext(cancelSnapshot);
    setChatMessages(prev => [...prev, { 
      id: Date.now() + "_process_cancel", 
      type: "ai", 
      timestamp: new Date(), 
      aIContext: cancelSnapshot 
    }]);
  };

  // -----------------------------
  // Chat reset
  // -----------------------------
  function handleClearChat() {
    const storeSnapshot = useAuthStore.getState().aIContext;
    const welcomeMessage = storeSnapshot.system.userLang === "Italian"
      ? "Ciao! Sono il tuo assistente AI. Come posso aiutarti oggi?"
      : "Hello! I am your AI assistant. How can I help you today?";

    const welcomeSnapshot: AIContext = { ...storeSnapshot, input: "", output: welcomeMessage,
      system: { ...storeSnapshot.system, currentDateTime: formatDateTime(new Date()), bookingSystemEnabled: false },
      form: { tripDeparture: "", tripDestination: "", dateTimeRoundTripDeparture: "", dateTimeRoundTripReturn: "", 
        durationOfStayInDays: 0, travelMode: "", budget: 0, people: 0, starsOfHotel: 0, luggages: 0 }};

    // Reset saga-related state
    if (sagaTransactionId) {
      sagaManager.cancelTransaction(sagaTransactionId);
    }
    setShowProcessDialog(false);
    setSagaTransactionId(null);

    updateAIContext(welcomeSnapshot);
    setChatMessages([{ id: "welcome", type: "ai", timestamp: new Date(), aIContext: welcomeSnapshot }]);
    
    // Close dialogs and reset states
    setShowBookingDialog(false);
    setBookingContext(null);
    setShowReasoningPanel(false);
    setCurrentProcessingContext(undefined);
    setAiStatus(null);
    setTestModeActivated(false); // Reset test mode
    inputRef.current?.focus();
  }

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

        {/* 🧪 Test Mode Indicator */}
        {ENABLE_TEST_MODE && (
          <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2 text-center">
            <span className="text-sm text-yellow-800">
              🧪 <strong>TEST MODE ACTIVE</strong> - Test booking will start automatically
            </span>
          </div>
        )}

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

      <BookingConfirmDialog
        isOpen={showBookingDialog}
        bookingContext={bookingContext}
        onConfirm={handleBookingConfirm}
        onCancel={handleBookingCancel}
        onModify={handleBookingModify}
        onClose={handleBookingClose}
      />

      <BookingProcessDialog
        isOpen={showProcessDialog}
        bookingContext={bookingContext}
        onClose={handleProcessClose}
        onComplete={handleProcessComplete}
        onError={handleProcessError}
      />

    </div>
  );
};

export default Chat;
