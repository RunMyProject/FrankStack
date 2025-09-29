/**
 * BookingProcessDialog.tsx
 * Saga Pattern Visualization Dialog (SSE Version)
 * -----------------------
 * Uses Server-Sent Events (SSE) to stream saga step updates
 * in real-time from the orchestrator backend.
 * 
 * Features:
 * - Real-time saga step visualization with SSE
 * - Multi-language support (Italian/English)
 * - Automatic state management with proper reset
 * - Compensation transaction ready architecture
 * - Responsive UI with gradient styling
 * - Progress tracking with step completion counter
 * 
 * Implementation Notes:
 * - Uses EventSource for server-sent events
 * - Full state reset on dialog close/open
 * - Handles connection errors gracefully
 * - Supports distributed transaction rollback scenarios
 *
 * Author: Edoardo Sabatini  
 * Date: 29 September 2025
 */

import React, { useEffect, useState } from 'react';
import type { AIContext, ProcessResult } from '../types/chat';
import type { SagaStep } from './SagaStepRow';
import { SagaStepRow } from './SagaStepRow';

interface BookingProcessDialogProps {
  isOpen: boolean;
  bookingContext: AIContext | null;
  onClose: () => void;
  onComplete: (result: ProcessResult) => void;
  onError: (error: string) => void;
}

const BookingProcessDialog: React.FC<BookingProcessDialogProps> = ({
  isOpen,
  bookingContext,
  onClose,
  onComplete,
  onError
}) => {
  const [steps, setSteps] = useState<SagaStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  const isItalian = bookingContext?.system.userLang === 'Italian';

  // 🔄 RESET EFFECT: Reset all states when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSteps([]);
      setIsProcessing(false);
      setHasCompleted(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Don't start if dialog is closed, no context, or already completed
    if (!isOpen || !bookingContext || hasCompleted) return;

    const initialSteps: SagaStep[] = [
      {
        id: 'service-a',
        name: isItalian ? 'Orchestratore Saga' : 'Saga Orchestrator',
        description: isItalian ? 'Inizializzazione transazione distribuita' : 'Initializing distributed transaction',
        status: 'pending'
      },
      {
        id: 'service-b',
        name: isItalian ? 'Servizio Trasporti' : 'Transport Service',
        description: isItalian ? 'Elaborazione prenotazione trasporti' : 'Processing transport booking',
        status: 'pending'
      },
      {
        id: 'service-c',
        name: isItalian ? 'Servizio Alloggi' : 'Accommodation Service',
        description: isItalian ? 'Elaborazione prenotazione hotel' : 'Processing hotel booking',
        status: 'pending'
      }
    ];

    setSteps(initialSteps);
    setIsProcessing(true);

    // 🎯 SSE IMPLEMENTATION: Real-time updates from saga orchestrator
    const es = new EventSource('http://localhost:8080/hello?word=world');

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { message, status } = data;

        // 🏁 COMPLETION HANDLER: Finalize process
        if (status === 'completed') {
          setHasCompleted(true);
          setIsProcessing(false);
          es.close();
          setTimeout(() => {
            onComplete({
              message: isItalian
                ? '🎉 Prenotazione completata con successo!'
                : '🎉 Booking completed successfully!',
              bookingDetails: {}
            });
          }, 500);
          return;
        }

        // ❌ ERROR HANDLER: Graceful error management
        if (status === 'error') {
          setIsProcessing(false);
          es.close();
          onError(message || 'Errore durante l\'elaborazione');
          return;
        }

        // 🔄 STEP UPDATER: Map SSE messages to saga steps
        let targetId: string | null = null;
        if (message.includes('Service A')) targetId = 'service-a';
        else if (message.includes('Service B')) targetId = 'service-b';
        else if (message.includes('Service C')) targetId = 'service-c';

        if (!targetId) return;

        setSteps(prev =>
          prev.map(step =>
            step.id === targetId
              ? { ...step, status: 'completed', data }
              : step
          )
        );

      } catch (parseError) {
        console.error('Errore parsing SSE:', parseError);
      }
    };

    // 🔌 CONNECTION ERROR HANDLER: Robust error recovery
    es.onerror = () => {
      console.error('Errore connessione SSE');
      setIsProcessing(false);
      if (es.readyState !== EventSource.CLOSED) {
        es.close();
      }
      onError('Connessione al server interrotta');
    };

    // 🧹 CLEANUP: Proper resource management
    return () => {
      if (es.readyState !== EventSource.CLOSED) {
        es.close();
      }
    };
  }, [isOpen, bookingContext, isItalian, onComplete, onError, hasCompleted]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* 🎨 GRADIENT HEADER: Visual appeal with brand colors */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
          <h2 className="text-xl font-bold">
            🔄 {isItalian ? 'Elaborazione Saga' : 'Saga Processing'}
          </h2>
          <p className="text-sm opacity-90 mt-1">
            {isItalian ? 'Transazione Distribuita in Corso' : 'Distributed Transaction in Progress'}
          </p>
        </div>

        {/* 📊 PROGRESS VISUALIZATION: Real-time step status */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {steps.map((step) => (
            <SagaStepRow
              key={step.id}
              step={step}
              isItalian={isItalian}
              showUserSelection={false}
              selectedOption=""
              setSelectedOption={() => {}}
              handleUserSelection={() => {}}
            />
          ))}
        </div>

        {/* 📈 PROGRESS FOOTER: Completion metrics and controls */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {isItalian
                ? `Passi completati: ${steps.filter(s => s.status === 'completed').length} / ${steps.length}`
                : `Completed steps: ${steps.filter(s => s.status === 'completed').length} / ${steps.length}`}
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              {isItalian ? 'Annulla' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingProcessDialog;

/**
 * BookingProcessDialog.tsx
 * Saga Pattern Visualization Dialog
 * -----------------------
 * Shows the booking process steps with visual feedback:
 * - ❌ Error
 * - ⚙️ Processing (spinning)
 * - ✅ Completed
 * - ⏳ Pending
 * 
 * Represents the distributed transaction saga pattern
 * for travel booking microservices orchestration
 *
 * Author: Edoardo Sabatini
 * Date: 25 September 2025
 *
import React, { useEffect, useState } from 'react';

// types
import type { AIContext, ProcessResult } from '../types/chat';
import type { SagaStep } from './SagaStepRow';

// copmonents
import { SagaStepRow } from './SagaStepRow';
import BookingSagaManager from '../utils/BookingSagaManager';

interface BookingProcessDialogProps {
  isOpen: boolean;
  bookingContext: AIContext | null;
  onClose: () => void;
  onComplete: (result: ProcessResult) => void;
  onError: (error: string) => void;
}

const BookingProcessDialog: React.FC<BookingProcessDialogProps> = ({
  isOpen,
  bookingContext,
  onClose,
  onComplete,
  onError
}) => {
  const [steps, setSteps] = useState<SagaStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [showUserSelection, setShowUserSelection] = useState(false);
  
  const isItalian = bookingContext?.system.userLang === 'Italian';

  // Initialize steps based on transport mode
  useEffect(() => {
    if (!isOpen || !bookingContext) return;
    
    // const transportMode = bookingContext.form.travelMode?.toLowerCase();
    const initialSteps: SagaStep[] = [
      {
        id: 'orchestrator',
        name: isItalian ? 'Orchestratore Saga' : 'Saga Orchestrator',
        description: isItalian ? 'Inizializzazione transazione distribuita' : 'Initializing distributed transaction',
        status: 'pending'
      }
      /*
      ,
      {
        id: 'transport_search',
        name: getTransportServiceName(transportMode, isItalian),
        description: isItalian 
          ? `Ricerca ${getTransportType(transportMode, isItalian)}` 
          : `Searching for ${getTransportType(transportMode, false)}`,
        status: 'pending'
      },
      {
        id: 'accommodation_search',
        name: isItalian ? 'Servizio Hotel' : 'Hotel Service',
        description: isItalian ? 'Ricerca sistemazione' : 'Searching accommodation',
        status: 'pending'
      },
      {
        id: 'payment_processing',
        name: isItalian ? 'Gateway Pagamento' : 'Payment Gateway',
        description: isItalian ? 'Elaborazione pagamento' : 'Processing payment',
        status: 'pending'
      },
      {
        id: 'booking_confirmation',
        name: isItalian ? 'Conferma Prenotazione' : 'Booking Confirmation',
        description: isItalian ? 'Finalizzazione prenotazione' : 'Finalizing booking',
        status: 'pending'
      }
      *
    ];

    setSteps(initialSteps);
    setCurrentStepIndex(0);
    setIsProcessing(true);
    
    // Start the saga process
    startSagaProcess(
        // initialSteps
    );
  }, [isOpen, bookingContext, isItalian]);

  const startSagaProcess = async (
    // initialSteps: SagaStep[]
  ) => {
    try {
      // Step 1: Orchestrator initialization
      await processStep(0, 'orchestrator', async () => {
        const sagaManager = new BookingSagaManager();
        const result = await sagaManager.executeApi(bookingContext!); // Ottieni il risultato della chiamata
        console.info("API Response:", JSON.stringify(result));
        return { orchestratorId: 'saga-' + Date.now() };
      });

      /*
      // Step 2: Transport search
      await processStep(1, 'transport_search', async () => {
        await simulateApiCall(1500);
        
        // Simulate sometimes finding results, sometimes requiring user input
        const hasDirectResults = Math.random() > 0.3; // 70% chance of finding results
        
        if (hasDirectResults) {
          return {
            found: true,
            options: generateMockTransportOptions(bookingContext!.form.travelMode, isItalian)
          };
        } else {
          // Require user selection
          throw new Error('USER_INPUT_REQUIRED');
        }
      });

      // Step 3: Hotel search
      await processStep(2, 'accommodation_search', async () => {
        await simulateApiCall(1200);
        return {
          found: true,
          hotelOptions: generateMockHotelOptions(bookingContext!.form.starsOfHotel, isItalian)
        };
      });

      // Step 4: Payment processing
      await processStep(3, 'payment_processing', async () => {
        await simulateApiCall(2000);
        
        // Simulate payment validation
        const paymentSuccess = Math.random() > 0.1; // 90% success rate
        if (!paymentSuccess) {
          throw new Error(isItalian ? 'Pagamento rifiutato dalla banca' : 'Payment rejected by bank');
        }
        
        return { 
          transactionId: 'txn-' + Date.now(),
          amount: bookingContext!.form.budget 
        };
      });

      // Step 5: Final confirmation
      await processStep(4, 'booking_confirmation', async () => {
        await simulateApiCall(1000);
        return { 
          bookingId: 'BKG-' + Date.now(),
          confirmationNumber: Math.random().toString(36).substr(2, 9).toUpperCase()
        };
      });
      *
      // All steps completed successfully
      setIsProcessing(false);
      setTimeout(() => {
        onComplete({
          message: isItalian ? '🎉 Prenotazione completata con successo!' : '🎉 Booking completed successfully!',
          bookingDetails: steps.reduce((acc, step) => ({ ...acc, ...(step.data as object) }), {})
        });
      }, 1000);

    } catch (error) {
      setIsProcessing(false);
      if (error instanceof Error && error.message === 'USER_INPUT_REQUIRED') {
        handleUserInputRequired();
      } else {
        onError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    }
  };

  const processStep = async (stepIndex: number, stepId: string, apiCall: () => Promise<unknown>) => {
    console.log(" BookingProcessDialog: processStep : step id" + stepId);
    // Set current step to processing
    setSteps(prev => prev.map((step, idx) => 
      idx === stepIndex ? { ...step, status: 'processing' as const } : step
    ));
    setCurrentStepIndex(stepIndex);

    try {
      const result = await apiCall();
      
      // Mark step as completed
      setSteps(prev => prev.map((step, idx) => 
        idx === stepIndex ? { ...step, status: 'completed' as const, data: result } : step
      ));
      
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause between steps
      
    } catch (error) {
      // Mark step as error
      setSteps(prev => prev.map((step, idx) => 
        idx === stepIndex ? { 
          ...step, 
          status: 'error' as const, 
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        } : step
      ));
      throw error;
    }
  };

  const handleUserInputRequired = () => {
    const transportOptions = generateMockTransportOptions(bookingContext!.form.travelMode, isItalian);
    
    setSteps(prev => prev.map((step, idx) => 
      idx === 1 ? { 
        ...step, 
        status: 'user_input_required' as const,
        description: isItalian ? 'Seleziona un\'opzione di trasporto' : 'Select a transport option',
        requiresUserSelection: true,
        options: transportOptions
      } : step
    ));
    
    setShowUserSelection(true);
  };

  const handleUserSelection = async () => {
    if (!selectedOption) return;
    
    setShowUserSelection(false);
    
    // Update step with user selection
    setSteps(prev => prev.map((step, idx) => 
      idx === 1 ? { 
        ...step, 
        status: 'completed' as const,
        description: isItalian ? 'Trasporto selezionato' : 'Transport selected',
        requiresUserSelection: false
      } : step
    ));

    // Continue with remaining steps
    try {
      await processStep(2, 'accommodation_search', async () => {
        await simulateApiCall(1200);
        return { hotelOptions: generateMockHotelOptions(bookingContext!.form.starsOfHotel, isItalian) };
      });

      await processStep(3, 'payment_processing', async () => {
        await simulateApiCall(2000);
        return { transactionId: 'txn-' + Date.now(), amount: bookingContext!.form.budget };
      });

      await processStep(4, 'booking_confirmation', async () => {
        await simulateApiCall(1000);
        return { bookingId: 'BKG-' + Date.now() };
      });

      setIsProcessing(false);
      setTimeout(() => {
        onComplete({
          message: isItalian ? '🎉 Prenotazione completata!' : '🎉 Booking completed!',
          selectedTransport: selectedOption
        });
      }, 1000);

    } catch (error) {
      setIsProcessing(false);
      onError(error instanceof Error ? error.message : 'Error during booking process');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* Header 
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
          <h2 className="text-xl font-bold">
            🔄 {isItalian ? 'Elaborazione Saga' : 'Saga Processing'}
          </h2>
          <p className="text-sm opacity-90 mt-1">
            {isItalian ? 'Transazione Distribuita in Corso' : 'Distributed Transaction in Progress'}
          </p>
        </div>

        {/* Steps 
        <div className="p-6 max-h-96 overflow-y-auto">
          {steps.map((step) => (
            <SagaStepRow
              key={step.id}
              step={step}
              isItalian={isItalian}
              showUserSelection={showUserSelection}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              handleUserSelection={handleUserSelection}
            />
          ))}
        </div>

        {/* Footer 
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {isItalian ? `Passo ${currentStepIndex + 1} di ${steps.length}` : `Step ${currentStepIndex + 1} of ${steps.length}`}
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing && !showUserSelection}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              {isItalian ? 'Annulla' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const simulateApiCall = (delay: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

const generateMockTransportOptions = (mode: string | undefined, isItalian: boolean) => {
  const baseOptions = [
    {
      id: 'option1',
      label: isItalian ? 'Opzione Economica' : 'Economy Option',
      price: 150,
      details: isItalian ? 'Partenza 08:00 - 1 fermata' : 'Departure 08:00 - 1 stop'
    },
    {
      id: 'option2', 
      label: isItalian ? 'Opzione Standard' : 'Standard Option',
      price: 280,
      details: isItalian ? 'Partenza 14:30 - Diretto' : 'Departure 14:30 - Direct'
    },
    {
      id: 'option3',
      label: isItalian ? 'Opzione Premium' : 'Premium Option', 
      price: 450,
      details: isItalian ? 'Partenza 16:00 - Servizi extra' : 'Departure 16:00 - Extra services'
    }
  ];

  console.log("BookingProcessDialog: generateMockTransportOptions" + mode);

  return baseOptions;
};

const generateMockHotelOptions = (stars: number, isItalian: boolean) => {
  return [
    {
      id: 'hotel1',
      label: isItalian ? `Hotel ${stars} Stelle - Centro` : `${stars} Star Hotel - City Center`,
      price: stars * 80,
      details: isItalian ? 'Colazione inclusa' : 'Breakfast included'
    }
  ];
};

/*
const getTransportServiceName = (mode: string | undefined, isItalian: boolean): string => {
  if (!mode) return isItalian ? 'Servizio Trasporto' : 'Transport Service';
  
  switch (mode.toLowerCase()) {
    case 'plane':
    case 'flight':
    case 'airplane':
      return isItalian ? 'Servizio Voli' : 'Flight Service';
    case 'train':
      return isItalian ? 'Servizio Treni' : 'Train Service';
    case 'bus':
      return isItalian ? 'Servizio Bus' : 'Bus Service';
    case 'car':
      return isItalian ? 'Servizio Auto' : 'Car Rental Service';
    default:
      return isItalian ? 'Servizio Trasporto' : 'Transport Service';
  }
};

const getTransportType = (mode: string | undefined, isItalian: boolean): string => {
  if (!mode) return isItalian ? 'trasporti' : 'transport';
  
  switch (mode.toLowerCase()) {
    case 'plane':
    case 'flight':
    case 'airplane':
      return isItalian ? 'voli' : 'flights';
    case 'train':
      return isItalian ? 'treni' : 'trains';
    case 'bus':
      return isItalian ? 'autobus' : 'buses';
    case 'car':
      return isItalian ? 'auto a noleggio' : 'rental cars';
    default:
      return isItalian ? 'trasporti' : 'transport';
  }
};
export default BookingProcessDialog;
*/

