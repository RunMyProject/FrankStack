/**
 * BookingManager.ts
 * -----------------
 * Backend Booking Manager implementing Two-Step Saga Pattern with Hazelcast storage.
 * 
 * Handles the communication with the orchestrator backend, SSE streaming,
 * and manages the booking process state including payment processing.
 * 
 * AUTHOR: Edoardo Sabatini
 * DATE: 17 October 2025
 */

import type { AIContext, ProcessResult } from '../types/chat';
import type { TransportOption, SagaStep, BookingEntry, HotelOption } from '../types/saga';
import { useAuthStore } from '../store/useAuthStore';

interface BookingManagerCallbacks {
  onStepUpdate: (steps: SagaStep[]) => void;
  onTransportOptions: (options: TransportOption[]) => void;
  onHotelOptions: (options: HotelOption[]) => void;
  onUserInputRequired: () => void;
  onPaymentRequired: (totalAmount: number) => void;
  onCompleted: (result: ProcessResult) => void;
  onError: (error: string) => void;
}

export class BookingManager {
  private eventSource: EventSource | null = null;
  private isSSEConnected = false;
  private steps: SagaStep[];
  private hasCompleted = false;
  private sagaId: string | null = null;
  private transportOptions: TransportOption[] = [];
  private hotelOptions: HotelOption[] = [];
  private callbacks: BookingManagerCallbacks;
  
  private readonly urlProxy = "http://localhost:8081/frankorchestrator";
  private readonly initialSteps: SagaStep[] = [
    {
      id: 'service-a',
      name: 'Saga Orchestrator',
      description: 'Initializing distributed transaction',
      status: 'pending',
      bookingEntry: {} as BookingEntry
    },
    {
      id: 'service-b',
      name: 'Transport Service',
      description: 'Processing transport booking',
      status: 'pending',
      bookingEntry: {} as BookingEntry
    },
    {
      id: 'service-c',
      name: 'Accommodation Service',
      description: 'Processing hotel booking',
      status: 'pending',
      bookingEntry: {} as BookingEntry
    },
    {
      id: 'service-d',
      name: 'Payment Service',
      description: 'Awaiting payment confirmation',
      status: 'pending',
      bookingEntry: {} as BookingEntry
    }
  ];

  constructor(callbacks: BookingManagerCallbacks) {
    this.callbacks = callbacks;
    this.steps = [...this.initialSteps];
  }

  // Get current state
  getSteps(): SagaStep[] {
    return [...this.steps];
  }

  getTransportOptions(): TransportOption[] {
    return [...this.transportOptions];
  }

  getHotelOptions(): HotelOption[] {
    return [...this.hotelOptions];
  }

  getSagaId(): string | null {
    return this.sagaId;
  }

  isCompleted(): boolean {
    return this.hasCompleted;
  }

  // Create new saga and start process
  async createSaga(bookingContext: AIContext): Promise<void> {
    try {
      const payload = {
        user: {
          username: bookingContext.system.user,
          userId: bookingContext.system.user
        },
        fillForm: { ...bookingContext.form }
      };

      console.log('📤 [POST] Creating saga:', payload);

      const response = await fetch(this.urlProxy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const { sagaCorrelationId: receivedSagaId } = await response.json();
      console.log('✅ [POST] Saga created:', receivedSagaId);
      
      this.sagaId = receivedSagaId;
      this.hasCompleted = false;
      
      // Establish SSE connection for the saga
      this.establishSSEConnection(receivedSagaId);

    } catch (error) {
      console.error('❌ [POST] Error creating saga:', error);
      this.callbacks.onError(error instanceof Error ? error.message : 'Error creating saga');
    }
  }

  // Send user travel selection to backend
  async sendUserSelection(selectedTravelId: string): Promise<void> {
    if (!selectedTravelId || !this.sagaId) {
      throw new Error('Missing selection or saga ID');
    }

    try {
      const json = {
        sagaCorrelationId: this.sagaId,
        selectedTravelId
      };

      console.log('📤 [POST] Sending user selection:', json);

      const response = await fetch(`${this.urlProxy}/sendbooktravel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(json)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ [POST] User selection confirmed, resuming saga...');

      // Update UI to show processing state after confirmation
      this.steps = this.steps.map(step => {
        if (step.id === 'service-b') {
          return {
            ...step,
            status: 'processing',
            description: 'Confirming transport booking...'
          };
        }
        return step;
      });

      this.callbacks.onStepUpdate([...this.steps]);

    } catch (error) {
      console.error('❌ [POST] Error confirming selection:', error);
      this.callbacks.onError(error instanceof Error ? error.message : 'Error confirming selection');
      throw error;
    }
  }

  // Send user hotel selection to backend
  async sendUserHotelSelection(selectedHotelId: string): Promise<void> {
     
      if (!selectedHotelId || !this.sagaId) {
        throw new Error('Missing selectedHotelId selection or saga ID');
      }

      // Update UI to show processing state after confirmation
      this.steps = this.steps.map(step => {
        if (step.id === 'service-c') {
          return {
            ...step,
            status: 'processing',
            description: 'Confirming hotel booking...'
          };
        }
        return step;
      });

      this.callbacks.onStepUpdate([...this.steps]);

      try {
          const json = {
            sagaCorrelationId: this.sagaId,
            selectedHotelId
          };

          console.log('📤 [POST] Hotel Selection: Sending user JSON:', json);

          const response = await fetch(`${this.urlProxy}/sendbookhotel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(json)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        
          console.log('✅ [POST] User Hotel Selection confirmed, resuming saga...');

      } catch (error) {
      console.error('❌ [POST] Error confirming Hotel selection:', error);
      this.callbacks.onError(error instanceof Error ? error.message : 'Error Hotel confirming selection');
      throw error;
    }
  }
  
  /**
   * sendPaymentDetails
   * -----------------------
   * Determines payment type and sends payment details.
   * For credit cards, delegates to sendPaymentWithDefaultCard.
   */
  async sendPaymentDetails(paymentId: string, paymentType: string): Promise<void> {
    if (paymentType === 'credit_card') {
      // Await the function to ensure the payment is processed before continuing
      await this.sendPaymentWithDefaultCard(paymentId);
    } else {
      console.log('TODO: handle other payment types in the future');
    }
  }

  /**
   * sendPaymentWithDefaultCard
   * -----------------------
   * Retrieves the default payment card token from Zustand store
   * and sends it to the backend AWS bridge for payment processing.
   *
   * Parameters:
   *   - paymentId: string → the payment identifier associated with the request
   */
  async sendPaymentWithDefaultCard(paymentId: string): Promise<void> {
    // ===============================
    // Step 1: Retrieve saved payment methods from AuthStore
    // ===============================
    const { savedPaymentMethods } = useAuthStore.getState();

    if (!savedPaymentMethods.length) {
      throw new Error('No payment methods saved in AuthStore');
    }

    // ===============================
    // Step 2: Determine which card to use
    // If paymentId matches a card, use it; otherwise use default or the first one
    // ===============================
    const selectedCard =
      savedPaymentMethods.find(m => m.id === paymentId) ||
      savedPaymentMethods.find(m => m.isDefault) ||
      savedPaymentMethods[0];

    if (!selectedCard) {
      throw new Error('No valid card found for payment');
    }

    // ===============================
    // Step 3: Extract the Stripe token and card ID
    // ===============================
    const myStripeToken = selectedCard.token;
    const paymentMethodId = selectedCard.id;

    if (!myStripeToken || !paymentMethodId || !this.sagaId) {
      throw new Error('Missing Stripe token, payment method ID, or saga ID');
    }

    console.log('💳 Using Stripe token:', myStripeToken);

    // ===============================
    // Step 4: Prepare payload for backend AWS bridge
    // ===============================
    const payload = {
      sagaCorrelationId: this.sagaId,
      paymentMethodId,
      paymentId,
      myStripeToken // renamed token field
    };

    console.log('📤 [POST] Payment Details: Sending JSON to AWS bridge:', payload);

    // ===============================
    // Step 5: Update UI to show processing state
    // ===============================
    this.steps = this.steps.map(step =>
      step.id === 'service-d'
        ? { ...step, status: 'processing', description: 'Processing payment...' }
        : step
    );
    this.callbacks.onStepUpdate([...this.steps]);

    // ===============================
    // Step 6: Send POST request to backend (AWS bridge)
    // ===============================
    try {
      const response = await fetch(`${this.urlProxy}/paymentsprocess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Payment submitted successfully, awaiting confirmation...');
    } catch (error) {
      console.error('❌ Error sending payment to AWS bridge:', error);
      this.callbacks.onError(error instanceof Error ? error.message : 'Error processing payment');
      throw error;
    }
  }

  // Establish SSE connection to stream saga updates
  private establishSSEConnection(sagaIdToConnect: string): void {
    if (this.isSSEConnected) return;
    
    console.log('🌊 [SSE] Connecting to stream:', sagaIdToConnect);
    this.eventSource = new EventSource(`${this.urlProxy}/${sagaIdToConnect}/stream`);
    this.isSSEConnected = true;

    this.eventSource.onmessage = (event) => {
      
      try {

        if(this.isCompleted()) return; // we ignore everything after the intentional closure

        const data = JSON.parse(event.data);
        const { message, status, bookingMessage } = data;

        console.log('📥 [SSE] Received:', data);

        // Step A completed → Transport processing
        if (message.includes('Saga processing started') && status === 'processing') {
          this.steps = this.steps.map(step => {
            if (step.id === 'service-a') {
              return { ...step, status: 'completed', data };
            }
            if (step.id === 'service-b') {
              return { ...step, status: 'processing', data };
            }
            return step;
          });
          this.callbacks.onStepUpdate([...this.steps]);
        }

        // Transport or hotel service completed, results available
        if (status === 'completed' || status === 'CONFIRMED') {
          const { results } = bookingMessage;
          if (!results) {
            console.warn('⚠️ [SSE] No results found in bookingMessage.');
            return;
          }

          // Look for transport options first (has type field in first item)
          const transportKey = Object.keys(results).find(
            key => results[key as keyof typeof results] !== null && 
            Array.isArray(results[key as keyof typeof results]) &&
            results[key as keyof typeof results][0]?.type // if first item has type field then it's transport
          );

          if (transportKey) {
            const transportOptions = results[transportKey as keyof typeof results];
            console.log(`🧭 [SSE] Detected filled transport mode: ${transportKey}`);

            this.transportOptions = transportOptions as TransportOption[];

            // Update saga step to wait for user input
            this.steps = this.steps.map(step =>
              step.id === 'service-b'
                ? {
                    ...step,
                    status: 'user_input_required',
                    description: 'Multiple transport options found — please select one.'
                  }
                : step
            );

            this.callbacks.onStepUpdate([...this.steps]);
            this.callbacks.onTransportOptions([...this.transportOptions]);
            this.callbacks.onUserInputRequired();
            return;
          }
          console.warn('⚠️ [SSE] No transport list options found');
          return;
        } // CONFIRMED (TRAVEL RESULTS)
        
        // TRANSPORT_CONFIRMED from Java listenerBookTravel (after user selection)
        if (status === 'TRANSPORT_CONFIRMED') {          
          console.log('✅ [SSE] Transport confirmed by backend');
          console.log('📦 [SSE] Full booking message:', bookingMessage);

          // Extract REAL booked data from sagaContext.bookingEntry
          const bookingEntry = bookingMessage?.sagaContext?.bookingEntry;
          
          console.log('🎫 [SSE] Booking entry (REAL booked data):', bookingEntry);

          if (!bookingEntry) {
            console.warn('⚠️ [SSE] No bookingEntry found in sagaContext');
            return;
          }

          // Update UI with transport icon and REAL backend data
          this.steps = this.steps.map(step => {
            if (step.id === 'service-b') {
              return {
                ...step,
                status: 'completed',
                description: 'Transport booking confirmed',
                bookingEntry: bookingEntry // save real booked data
              };
            }
            if (step.id === 'service-c') {
              return { ...step, status: 'processing', description: 'Processing accommodation...' };
            }
            return step;
          });

          this.callbacks.onStepUpdate([...this.steps]);

          // Stream stays open - waiting for accommodation
          console.log('⏳ [SSE] Waiting for accommodation confirmation...');
          return;
        } // TRANSPORT_CONFIRMED

        // HOTEL_CONFIRMED - new status from Java listenerBookAccommodation for HotelResults
        if (status === 'HOTEL_CONFIRMED') {
          console.log('🏨 [SSE] Hotel confirmed by backend');
          console.log('📦 [SSE] Full booking message:', bookingMessage);

          // Extract REAL booked data from sagaContext.bookingEntry
          const { hotelResults } = bookingMessage;
          
          if (!hotelResults) {
            console.warn('⚠️ [SSE] No hotel list options found');
            console.warn('⚠️ [SSE] No hotelResults found in sagaContext for hotel');
            return;
          }

          this.hotelOptions = hotelResults.hotels as HotelOption[];

          console.log('🏨 [SSE] Hotel List Options:', this.hotelOptions);

          // Update saga step to wait for user input
          this.steps = this.steps.map(step =>
            step.id === 'service-c'
              ? {
                  ...step,
                  status: 'user_input_required',
                  description: 'Multiple accommodation options found — please select one.'
                }
              : step
          );

          this.callbacks.onStepUpdate([...this.steps]);
          this.callbacks.onHotelOptions([...this.hotelOptions]);
          this.callbacks.onUserInputRequired();
          
          return;       
        } // HOTEL_CONFIRMED - HOTEL RESULTS

        // HOTEL_BOOKING_CONFIRMED - final hotel booking confirmation (like TRANSPORT_CONFIRMED)
        if (status === 'HOTEL_BOOKING_CONFIRMED') {
          console.log('✅ [SSE] Hotel booking confirmed by backend');
          console.log('📦 [SSE] Full booking message:', bookingMessage);

          // Extract REAL booked hotel data from sagaContext.hotelBookingEntry
          const hotelBookingEntry = bookingMessage?.sagaContext?.hotelBookingEntry;
          
          console.log('🏨 [SSE] Hotel Booking entry (REAL booked data):', hotelBookingEntry);

          if (!hotelBookingEntry) {
            console.warn('⚠️ [SSE] No hotelBookingEntry found in sagaContext');
            return;
          }

          // Update UI with hotel data in the green recap box
          this.steps = this.steps.map(step => {
            if (step.id === 'service-c') {
              return {
                ...step,
                status: 'completed',
                description: 'Hotel booking confirmed',
                bookingEntry: hotelBookingEntry // save real booked hotel data
              };
            }
            if (step.id === 'service-d') {
              return {
                ...step,
                status: 'user_input_required',
                description: 'Please select payment method'
              };
            }
            return step;
          });

          this.callbacks.onStepUpdate([...this.steps]);

          // Calculate total amount for payment
          const transportStep = this.steps.find(s => s.id === 'service-b');
          const accommodationStep = this.steps.find(s => s.id === 'service-c');
          const transportPrice = transportStep?.bookingEntry?.price || 0;
          const accommodationPrice = accommodationStep?.bookingEntry?.price || hotelBookingEntry?.price || 0;
          const totalAmount = transportPrice + accommodationPrice;

          // Trigger payment selection UI
          this.callbacks.onPaymentRequired(totalAmount);
          this.callbacks.onUserInputRequired();

          // Stream stays open - waiting for payment
          console.log('⏳ [SSE] Waiting for payment selection...');
          return;
        }

        // PAYMENT_CONFIRMED - payment processed successfully
        if (status === 'PAYMENT_CONFIRMED') {

          console.log('✅ [SSE] Payment confirmed by backend');

          const emitPayload = data;

          console.log('📦 [SSE] Payment confirmation:', emitPayload);

          const {
              invoiceUrl,
              emissionClosed,
              message,
              sagaCorrelationId,
              timestamp
          } = { ...emitPayload };

          console.log('invoiceUrl:', invoiceUrl);
          console.log('emissionClosed:', emissionClosed);
          console.log('message:', message);
          console.log('sagaCorrelationId:', sagaCorrelationId);
          console.log('timestamp:', timestamp);

          // Update payment step to completed
          this.steps = this.steps.map(step => {
            if (step.id === 'service-d') {
              return {
                ...step,
                status: 'completed',
                description: '✅ Payment processed successfully'
              };
            }
            return step;
          });

          this.callbacks.onStepUpdate([...this.steps]);

          // Stream stays open - waiting for final confirmation or TTL
          // if an error occurs it times out!
          //
          console.log('🐌 [SSE] Closing SAGA... 🐌');          
          this.closeSaga(sagaCorrelationId); // close the SAGA flow permanently
          return;
        }

        // Final CONFIRMED from Java listener (complete saga)
        if (status === 'CONFIRMED') {
          console.log('📥 [SSE] CONFIRMED received');
          console.log('📦 [SSE] Booking message:', bookingMessage);

          // Check if this contains the old "results" structure (transport results)
          const hasTransportResults = bookingMessage?.results?.flights || 
                                     bookingMessage?.results?.trains ||
                                     bookingMessage?.results?.buses ||
                                     bookingMessage?.results?.cars ||
                                     bookingMessage?.results?.hotels;

          if (hasTransportResults) {
            console.log('⏭️ [SSE] IGNORING - This is the old results, not final confirmation');
            console.log('⏭️ [SSE] Waiting for real final confirmation...');  
            return;
          }

          // This should be the real final confirmation
          console.log('✅ [SSE] Processing final confirmation');

          // if service-d not yet marked completed, do it now
          if (!this.steps.some(s => s.id === 'service-d' && s.status === 'completed')) {
            this.steps = this.steps.map(step =>
              step.id === 'service-d'
                ? { 
                    ...step, 
                    status: 'completed', 
                    description: '✅ Payment completed',
                    bookingMessage 
                  }
                : step
            );
          }

          // obtain transport, accommodation, and payment details
          const transportStep = this.steps.find(s => s.id === 'service-b');
          const accommodationStep = this.steps.find(s => s.id === 'service-c');

          const transportPrice = transportStep?.bookingEntry?.price || 0;
          const accommodationPrice = accommodationStep?.bookingEntry?.price || bookingMessage?.price || 0;

          setTimeout(() => {
            this.callbacks.onCompleted({
              message: '🎉 Booking completed successfully!',
              bookingDetails: {
                sagaId: sagaIdToConnect,
                transport: transportStep?.bookingEntry,
                accommodation: accommodationStep?.bookingEntry || bookingMessage,
                totalPrice: transportPrice + accommodationPrice
              }
            });
          }, 500);

          this.cleanup();
          return;
        }

        if (status === 'error' || status === 'FAILED') {
          this.cleanup();
          this.callbacks.onError(message || 'Error during processing');
        }

      } catch (parseError) {
        console.error('❌ [SSE] Parse error:', parseError);
      }
    };

    this.eventSource.onerror = (error) => {      
      if (this.isCompleted()) {        
        console.log('✅ [SSE] Stream closed normally');        
        this.cleanup();
        return;
      }
      console.error('❌ [SSE] Connection error:', error);
      this.cleanup();
      this.callbacks.onError('Server connection interrupted');
    };
  }

  // Cleanup resources
  cleanup(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isSSEConnected = false;
  }

  // Reset state
  reset(): void {
    this.cleanup();
    this.steps = [...this.initialSteps];
    this.hasCompleted = false;
    this.sagaId = null;
    this.transportOptions = [];
    this.hotelOptions = [];
  }

  // Call the backend to close the saga once React has received the invoice
  //
  closeSaga(sagaCorrelationId: string): void {
    try {

      console.log(`🔒 [closeSaga] Calling backend to close saga: ${sagaCorrelationId}`);

      fetch(`http://localhost:8081/frankcallback/closeSaga?sagaCorrelationId=${sagaCorrelationId}`, {
        method: 'POST'
      });

      console.log(`🔒 [closeSaga] Called backend to close saga: ${sagaCorrelationId}`);

      this.hasCompleted = true;

    } catch (error) {
      console.error('❌ [closeSaga] Error calling backend:', error);
    }
  }

}
