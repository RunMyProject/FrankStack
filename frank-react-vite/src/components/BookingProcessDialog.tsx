/**
 * BookingProcessDialog.tsx
 * -------------------------
 * React Component implementing a Two-Step Saga Pattern with Hazelcast storage.
 *
 * SAGA OVERVIEW:
 * - Step 1: POST /frankorchestrator
 *     - Creates a new saga instance and stores the booking context in Hazelcast.
 *     - Returns a unique sagaCorrelationId used for tracking the distributed transaction.
 * - Step 2: GET SSE /frankorchestrator/{sagaId}/stream
 *     - Establishes a Server-Sent Events (SSE) connection to stream real-time saga updates.
 *     - Receives progress and completion messages for each orchestrated step.
 *
 * FLOW:
 * 1. User opens BookingProcessDialog → A POST request creates the saga.
 * 2. Backend responds with sagaId → EventSource connects to the SSE endpoint.
 * 3. Orchestrator emits messages such as:
 *    - "Saga processing started" → Orchestrator finished, transport service begins.
 *    - "CONFIRMED" or "completed" → Saga finished successfully, triggering onComplete().
 *    - "error" or "FAILED" → Saga failed, triggering onError().
 *
 * FEATURES:
 * - Clear separation between storage (Hazelcast) and execution (orchestrator).
 * - Real-time updates via EventSource (SSE).
 * - Multi-step visualization using SagaStepRow components.
 * - Proper cleanup on dialog close or connection interruption.
 * - Internationalization-ready (English / Italian).
 *
 * AUTHOR: Edoardo Sabatini
 * DATE: 05 October 2025
 */

import React, { useEffect, useState } from 'react';
import type { AIContext, ProcessResult } from '../types/chat';
import type { TransportOption, SagaStep } from '../types/saga';
import SagaStepRow from './SagaStepRow';

// --------------------------------------
//  BookingProcessDialog Component
// --------------------------------------
const BookingProcessDialog: React.FC<{
  isOpen: boolean;
  bookingContext: AIContext | null;
  onClose: () => void;
  onComplete: (result: ProcessResult) => void;
  onError: (error: string) => void;
}> = ({ isOpen, bookingContext, onClose, onComplete, onError }) => {

  // -----------------------
  //   React State Hooks
  // -----------------------
  const [steps, setSteps] = useState<SagaStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [sagaId, setSagaId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  // Backend Orchestrator endpoint
  const urlProxy = "http://localhost:8081/frankorchestrator";

  // Initial step definitions for UI
  const initialSteps: SagaStep[] = [
    {
      id: 'service-a',
      name: 'Saga Orchestrator',
      description: 'Initializing distributed transaction',
      status: 'pending'
    },
    {
      id: 'service-b',
      name: 'Transport Service',
      description: 'Processing transport booking',
      status: 'pending'
    },
    {
      id: 'service-c',
      name: 'Accommodation Service',
      description: 'Processing hotel booking',
      status: 'pending'
    }
  ];

  // Reset dialog state when closed or reopened
  useEffect(() => {
    if (!isOpen) {
      setSteps(initialSteps);
      setIsProcessing(false);
      setHasCompleted(false);
      setSagaId(null);
      setSelectedOption('');
      setTransportOptions([]);
      setIsConfirming(false);
    } else {
      setSteps(initialSteps);
    }
  }, [isOpen]);

  // --------------------------------------
  //  Handle user selection confirmation
  // --------------------------------------
  const handleConfirmSelection = async () => {
    if (!selectedOption || !sagaId) return;
    setIsConfirming(true);

    try {
      console.log('📤 [POST] Sending user selection:', { sagaId, selectedOption });

      const response = await fetch(`${urlProxy}/${sagaId}/continue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          selectedTransportId: selectedOption,
          stepId: 'service-b'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ [POST] User selection confirmed, resuming saga...');

      // Update UI for transport step
      const selectedFlight = transportOptions.find(o => o.id === selectedOption);
      setSteps(prev =>
        prev.map(step => {
          if (step.id === 'service-b') {
            return {
              ...step,
              status: 'completed',
              description: `Flight selected: ${selectedFlight?.airline} ${selectedFlight?.flightNumber}`,
              data: selectedFlight
            };
          }
          if (step.id === 'service-c') {
            return { ...step, status: 'processing' };
          }
          return step;
        })
      );

      // Reconnect to SSE for accommodation step
      console.log('🌊 [SSE] Reconnecting to stream...');
      const eventSource = new EventSource(`${urlProxy}/${sagaId}/stream`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { message, status } = data;

          console.log('📥 [SSE] Received (post-selection):', data);

          if (status === 'completed' || status === 'CONFIRMED') {
            setSteps(prev =>
              prev.map(step =>
                step.id === 'service-c'
                  ? { ...step, status: 'completed', data }
                  : step
              )
            );

            setHasCompleted(true);
            setIsProcessing(false);
            setIsConfirming(false);
            eventSource.close();

            setTimeout(() => {
              onComplete({
                message: '🎉 Booking completed successfully!',
                bookingDetails: {
                  sagaId,
                  selectedFlight,
                  totalPrice: selectedFlight?.price
                }
              });
            }, 500);
            return;
          }

          if (status === 'error' || status === 'FAILED') {
            setIsProcessing(false);
            setIsConfirming(false);
            eventSource.close();
            onError(message || 'Error during processing');
          }

          if (message.includes('Hotel')) {
            setSteps(prev =>
              prev.map(step =>
                step.id === 'service-c'
                  ? { ...step, status: 'processing', data }
                  : step
              )
            );
          }

        } catch (parseError) {
          console.error('❌ [SSE] Parse error:', parseError);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ [SSE] Connection error:', error);
        setIsProcessing(false);
        setIsConfirming(false);
        eventSource.close();
        onError('Server connection interrupted');
      };

    } catch (error) {
      console.error('❌ [POST] Error confirming selection:', error);
      setIsConfirming(false);
      onError(error instanceof Error ? error.message : 'Error confirming selection');
    }
  };

  // --------------------------------------
  //  Initial Saga creation and SSE stream
  // --------------------------------------
  useEffect(() => {
    if (!isOpen || !bookingContext || hasCompleted || sagaId !== null) return;
    setIsProcessing(true);

    const createAndStreamSaga = async () => {
      try {
        const payload = {
          user: {
            username: bookingContext.system.user,
            userId: bookingContext.system.user
          },
          fillForm: { ...bookingContext.form }
        };

        console.log('📤 [POST] Creating saga:', payload);

        const postResponse = await fetch(urlProxy, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (!postResponse.ok) {
          throw new Error(`HTTP ${postResponse.status}: ${postResponse.statusText}`);
        }

        const { sagaCorrelationId: receivedSagaId } = await postResponse.json();
        console.log('✅ [POST] Saga created:', receivedSagaId);
        setSagaId(receivedSagaId);

        console.log('🌊 [SSE] Connecting to stream:', receivedSagaId);
        const eventSource = new EventSource(`${urlProxy}/${receivedSagaId}/stream`);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { message, status, bookingMessage } = data;

            console.log('📥 [SSE] Received:', data);

            // Step A completed → Transport processing
            if (message.includes('Saga processing started') && status === 'processing') {
              setSteps(prev =>
                prev.map(step => {
                  if (step.id === 'service-a') {
                    return { ...step, status: 'completed', data };
                  }
                  if (step.id === 'service-b') {
                    return { ...step, status: 'processing', data };
                  }
                  return step;
                })
              );
            }

            // Transport service completed, results available
            if (status === 'completed' || status === 'CONFIRMED') {
              const { results } = bookingMessage;
              if (!results) {
                console.warn('⚠️ [SSE] No results found in bookingMessage.');
                return;
              }

              // Dynamically detect which transport array is populated
              const filledKey = Object.keys(results).find(
                key => results[key as keyof typeof results] !== null
              );

              if (!filledKey) {
                console.warn('⚠️ [SSE] No transport option filled.');
                return;
              }

              const transportOptions = results[filledKey as keyof typeof results];
              console.log(`🧭 [SSE] Detected filled transport mode: ${filledKey}`);

              setTransportOptions(transportOptions as TransportOption[]);

              // Update saga step to wait for user input
              setSteps(prev =>
                prev.map(step =>
                  step.id === 'service-b'
                    ? {
                        ...step,
                        status: 'user_input_required',
                        description: 'Multiple transport options found — please select one.'
                      }
                    : step
                )
              );

              setIsProcessing(false);
              eventSource.close();
              return;
            }

            if (status === 'error' || status === 'FAILED') {
              setIsProcessing(false);
              eventSource.close();
              onError(message || 'Error during processing');
            }

          } catch (parseError) {
            console.error('❌ [SSE] Parse error:', parseError);
          }
        };

        eventSource.onerror = (error) => {
          console.error('❌ [SSE] Connection error:', error);
          if (eventSource.readyState === EventSource.CLOSED && hasCompleted) {
            console.log('✅ [SSE] Stream closed normally');
            return;
          }
          setIsProcessing(false);
          eventSource.close();
          onError('Server connection interrupted');
        };

      } catch (error) {
        console.error('❌ [POST] Error creating saga:', error);
        setIsProcessing(false);
        onError(error instanceof Error ? error.message : 'Error creating saga');
      }
    };

    createAndStreamSaga();

  }, [isOpen, bookingContext, hasCompleted, sagaId]);

  // --------------------------------------
  //  UI Rendering
  // --------------------------------------
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
          <h2 className="text-lg font-bold">Saga Processing</h2>
          <p className="text-xs opacity-90 mt-1">Distributed Transaction Flow</p>
          {sagaId && (
            <p className="text-xs opacity-75 mt-1 font-mono">
              ID: {sagaId.substring(0, 12)}...
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="p-5 flex-1 overflow-y-auto">
          {steps.map(step => (
            <SagaStepRow
              key={step.id}
              step={step}
              options={step.id === 'service-b' ? transportOptions : undefined}
              selectedOption={selectedOption}
              onSelectOption={setSelectedOption}
              onConfirmOption={handleConfirmSelection}
              isConfirming={isConfirming}
              transportMode={bookingContext?.form.travelMode}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {steps.filter(s => s.status === 'completed').length} / {steps.length} completed
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing || isConfirming}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingProcessDialog;
