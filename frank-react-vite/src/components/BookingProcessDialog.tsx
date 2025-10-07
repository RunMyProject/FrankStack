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
 *    - "TRANSPORT_CONFIRMED" → Transport booked, continue to accommodation.
 *    - "CONFIRMED" → Saga finished successfully, triggering onComplete().
 *    - "error" or "FAILED" → Saga failed, triggering onError().
 *
 * FEATURES:
 * - Clear separation between storage (Hazelcast) and execution (orchestrator).
 * - Real-time updates via EventSource (SSE).
 * - Multi-step visualization using SagaStepRow components.
 * - Proper cleanup on dialog close or connection interruption.
 * - Internationalization-ready (English / Italian).
 *
 * Uses BookingManager for backend communication and displays the booking process.
 *
 * AUTHOR: Edoardo Sabatini
 * DATE: 07 October 2025
 */

import React, { useEffect, useState, useRef } from 'react';
import type { AIContext, ProcessResult } from '../types/chat';
import type { TransportOption, HotelOption, SagaStep } from '../types/saga';
import { BookingManager } from '../services/BookingManager';
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
  const [hotelOptions, setHotelOptions] = useState<HotelOption[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  // Ref for BookingManager instance
  const bookingManagerRef = useRef<BookingManager | null>(null);

  // Reset dialog state when closed or reopened
  useEffect(() => {
    if (!isOpen) {
      // Cleanup booking manager
      if (bookingManagerRef.current) {
        bookingManagerRef.current.cleanup();
        bookingManagerRef.current = null;
      }
      
      // Reset state
      setSteps([]);
      setIsProcessing(false);
      setHasCompleted(false);
      setSagaId(null);
      setSelectedOption('');
      setTransportOptions([]);
      setHotelOptions([]);
      setIsConfirming(false);
    }
  }, [isOpen]);

  // Initialize BookingManager with callbacks
  useEffect(() => {
    if (!isOpen) return;

    const callbacks = {
      onStepUpdate: (updatedSteps: SagaStep[]) => {
        setSteps(updatedSteps);
      },
      onTransportOptions: (options: TransportOption[]) => {
        setTransportOptions(options);
      },
      onHotelOptions: (options: HotelOption[]) => {
        setHotelOptions(options);
      },
      onUserInputRequired: () => {
        setIsProcessing(false);
      },
      onCompleted: (result: ProcessResult) => {
        setHasCompleted(true);
        setIsProcessing(false);
        onComplete(result);
      },
      onError: (error: string) => {
        setIsProcessing(false);
        onError(error);
      }
    };

    bookingManagerRef.current = new BookingManager(callbacks);
    setSteps(bookingManagerRef.current.getSteps());
  }, [isOpen]);

  // Start saga when dialog opens and context is available
  useEffect(() => {
    if (!isOpen || !bookingContext || hasCompleted) return;
    
    const startBookingProcess = async () => {
      if (!bookingManagerRef.current) return;
      
      setIsProcessing(true);
      await bookingManagerRef.current.createSaga(bookingContext);
      setSagaId(bookingManagerRef.current.getSagaId());
    };

    startBookingProcess();
  }, [isOpen, bookingContext, hasCompleted]);

  // --------------------------------------
  //  Handle user selection confirmation
  // --------------------------------------
  const handleConfirmSelection = async () => {
    if (!selectedOption || !bookingManagerRef.current) return;
    setIsConfirming(true);

    try {
      await bookingManagerRef.current.sendUserSelection(selectedOption);
      // State updates are handled via callbacks
    } catch (error) {
        if(error instanceof Error) {
          onError(error.message);
        } 
      // Error handling is done via callbacks
    } finally {
      setIsConfirming(false);
    }
  };

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
              options={
                step.id === 'service-b' ? transportOptions : 
                step.id === 'service-c' ? hotelOptions : 
                undefined
              }
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
