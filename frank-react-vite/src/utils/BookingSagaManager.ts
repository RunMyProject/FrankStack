/**
 * BookingSagaManager.ts
 * Saga Pattern Business Logic Manager
 * -----------------------
 * Orchestrates the distributed booking transaction
 * across multiple microservices with compensation logic.
 * 
 * Implements the Saga Pattern for:
 * - Transport booking (flights/trains/buses/cars)
 * - Hotel reservation
 * - Payment processing
 * - Booking confirmation
 * 
 * Features:
 * - Automatic retry mechanisms
 * - Compensation transactions (rollback)
 * - Async microservice communication simulation
 * - Real-time status updates
 *
 * Author: Edoardo Sabatini
 * Date: 29 September 2025
 */

import type { AIContext } from '../types/chat';

export interface SagaStepResult {
  success: boolean;
  data?: unknown;
  error?: string;
  requiresUserInput?: boolean;
  options?: Array<{
    id: string;
    label: string;
    price?: number;
    details?: string;
  }>;
}

export interface CompensationAction {
  stepId: string;
  action: () => Promise<void>;
  description: string;
}

export interface SagaTransaction {
  id: string;
  context: AIContext;
  steps: string[];
  completedSteps: string[];
  failedStep?: string;
  compensations: CompensationAction[];
  status: 'initializing' | 'running' | 'completed' | 'failed' | 'compensating' | 'compensated';
}

class BookingSagaManager {
  private transactions = new Map<string, SagaTransaction>();
  private stepCallbacks = new Map<string, (step: string, status: string, data?: unknown) => void>();

  async executeApi(context: AIContext): Promise<SagaStepResult> {
    const form = JSON.stringify(context.form);
    console.log("API Context Form:", form);

    return new Promise<SagaStepResult>((resolve) => {
      const es = new EventSource("http://localhost:8080/hello?word=world");

      es.onmessage = (event) => {
        console.log("RAW SSE DATA:", event.data);
        let serverData: { message?: string; timestamp?: string; status?: string };
        try {
          serverData = JSON.parse(event.data);
        } catch (e) {
          console.warn("Non era JSON:", e);
          serverData = { message: event.data };
        }

        const { message = "no message", timestamp = new Date().toISOString(), status = "success" } = serverData;

        console.log("EXTRACTED MESSAGE:", message);
        console.log("EXTRACTED TIMESTAMP:", timestamp);
        console.log("EXTRACTED STATUS:", status);
        console.log("-----------");

        // ✅ Risolvi SOLO quando arriva l'evento finale
        if (status === "completed") {
          resolve({
            success: true,
            data: { message, timestamp, status }
          });
          es.close(); // Ora possiamo chiudere
        }
        // Altrimenti: continua ad ascoltare (non fare nulla)
      };

      es.onerror = (err) => {
        console.error("Errore SSE:", err);
        es.close();
        resolve({
          success: false,
          error: "Errore SSE"
        });
      };
    });
  }

  async executeApi_old(context: AIContext): Promise<SagaStepResult> {
    const form = JSON.stringify(context.form);
    console.log("API Context Form: " + form);

    try {
      // API REST
      const response = await fetch('http://localhost:8080/hello?word=world', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Errore API: ${response.status} - ${response.statusText}`);
      }

      const apiData = await response.json();

      return {
        success: true,
        data: apiData
      };
    } catch (error) {
      console.error("Errore durante la chiamata API:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      };
    }

    
/*
    const apiData = {
      message: "Hello World API Response",
      timestamp: new Date().toISOString(),
      status: "success"
    };

    return {
      success: true,
      data: apiData
    };
*/

  }


  /**
   * Starts a new saga transaction
   */
  async startSagaTransaction(
    context: AIContext,
    onStepUpdate: (step: string, status: string, data?: unknown) => void
  ): Promise<string> {
    const transactionId = `saga-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction: SagaTransaction = {
      id: transactionId,
      context,
      steps: this.getStepsForBooking(
      // context
      ),
      completedSteps: [],
      compensations: [],
      status: 'initializing'
    };

    this.transactions.set(transactionId, transaction);
    this.stepCallbacks.set(transactionId, onStepUpdate);

    try {
      await this.executeTransaction(transactionId);
      return transactionId;
    } catch (error) {
      await this.compensateTransaction(transactionId);
      throw error;
    }
  }

  /**
   * Get saga steps based on booking context
   */
  private getStepsForBooking(
  //  context: AIContext
  ): string[] {
    return [
      'orchestrator_init'
/*    ,
      'transport_search',
      'accommodation_search', 
      'payment_processing',
      'booking_confirmation'
*/      
    ];
  }

  /**
   * Execute the saga transaction step by step
   */
  private async executeTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) throw new Error('Transaction not found');

    transaction.status = 'running';
    const callback = this.stepCallbacks.get(transactionId);

    for (const stepId of transaction.steps) {
      try {
        callback?.(stepId, 'processing');
        
        const result = await this.executeStep(stepId, transaction);
        
        if (result.requiresUserInput) {
          // Pause saga for user input
          callback?.(stepId, 'user_input_required', result);
          return; // Transaction will be resumed after user input
        }

        if (!result.success) {
          transaction.failedStep = stepId;
          transaction.status = 'failed';
          callback?.(stepId, 'error', { error: result.error });
          throw new Error(`Step ${stepId} failed: ${result.error}`);
        }

        transaction.completedSteps.push(stepId);
        callback?.(stepId, 'completed', result.data);
        
        // Brief pause between steps for UX
        await this.delay(300);

      } catch (error) {
        transaction.failedStep = stepId;
        transaction.status = 'failed';
        callback?.(stepId, 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    }

    transaction.status = 'completed';
  }

  /**
   * Resume transaction after user input
   */
  async resumeTransaction(
    transactionId: string, 
    userSelection: string, 
    stepId: string
  ): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) throw new Error('Transaction not found');

    const callback = this.stepCallbacks.get(transactionId);
    
    try {
      // Complete the step with user selection
      transaction.completedSteps.push(stepId);
      callback?.(stepId, 'completed', { userSelection });

      // Continue with remaining steps
      const remainingSteps = transaction.steps.slice(transaction.completedSteps.length);
      
      for (const nextStepId of remainingSteps) {
        callback?.(nextStepId, 'processing');
        
        const result = await this.executeStep(nextStepId, transaction);
        
        if (!result.success) {
          transaction.failedStep = nextStepId;
          transaction.status = 'failed';
          callback?.(nextStepId, 'error', { error: result.error });
          throw new Error(`Step ${nextStepId} failed: ${result.error}`);
        }

        transaction.completedSteps.push(nextStepId);
        callback?.(nextStepId, 'completed', result.data);
        
        await this.delay(300);
      }

      transaction.status = 'completed';
      
    } catch (error) {
      await this.compensateTransaction(transactionId);
      throw error;
    }
  }

  /**
   * Execute individual saga step
   */
  private async executeStep(stepId: string, transaction: SagaTransaction): Promise<SagaStepResult> {
    const { context } = transaction;

    switch (stepId) {
      case 'orchestrator_init':
        return this.executeOrchestratorInit(context);
        
      case 'transport_search':
        return this.executeTransportSearch(context);
        
      case 'accommodation_search':
        return this.executeAccommodationSearch(context);
        
      case 'payment_processing':
        return this.executePaymentProcessing(context);
        
      case 'booking_confirmation':
        return this.executeBookingConfirmation(context);
        
      default:
        return { success: false, error: `Unknown step: ${stepId}` };
    }
  }

  /**
   * Orchestrator initialization step
   */
  private async executeOrchestratorInit(context: AIContext): Promise<SagaStepResult> {
    await this.simulateApiCall('orchestrator');
    
    const orchestratorData = {
      sagaId: `saga-${Date.now()}`,
      timestamp: new Date().toISOString(),
      context: {
        departure: context.form.tripDeparture,
        destination: context.form.tripDestination,
        transport: context.form.travelMode,
        budget: context.form.budget
      }
    };

    return {
      success: true,
      data: orchestratorData
    };
  }

  /**
   * Transport search microservice call
   */
  private async executeTransportSearch(context: AIContext): Promise<SagaStepResult> {
    await this.simulateApiCall('transport-service');

    // Simulate API response - sometimes requires user selection
    const hasDirectAvailability = Math.random() > 0.3; // 70% success rate
    
    if (!hasDirectAvailability) {
      return {
        success: false,
        requiresUserInput: true,
        options: this.generateTransportOptions(context.form.travelMode, context.system.userLang === 'Italian')
      };
    }

    return {
      success: true,
      data: {
        transportId: `transport-${Date.now()}`,
        mode: context.form.travelMode,
        price: this.calculateTransportPrice(context.form.travelMode, context.form.budget),
        departure: context.form.tripDeparture,
        destination: context.form.tripDestination
      }
    };
  }

  /**
   * Hotel booking microservice call
   */
  private async executeAccommodationSearch(context: AIContext): Promise<SagaStepResult> {
    await this.simulateApiCall('hotel-service');

    // Simulate hotel availability check
    const hasAvailability = Math.random() > 0.1; // 90% success rate
    
    if (!hasAvailability) {
      return {
        success: false,
        error: context.system.userLang === 'Italian' 
          ? 'Nessun hotel disponibile per le date selezionate'
          : 'No hotels available for selected dates'
      };
    }

    return {
      success: true,
      data: {
        hotelId: `hotel-${Date.now()}`,
        stars: context.form.starsOfHotel,
        price: context.form.starsOfHotel * 80 * context.form.durationOfStayInDays,
        checkin: context.form.dateTimeRoundTripDeparture,
        checkout: context.form.dateTimeRoundTripReturn,
        rooms: Math.ceil(context.form.people / 2)
      }
    };
  }

  /**
   * Payment processing microservice
   */
  private async executePaymentProcessing(context: AIContext): Promise<SagaStepResult> {
    await this.simulateApiCall('payment-gateway');

    // Simulate bank validation
    const paymentApproved = Math.random() > 0.1; // 90% success rate
    
    if (!paymentApproved) {
      return {
        success: false,
        error: context.system.userLang === 'Italian'
          ? 'Pagamento rifiutato dalla banca - Verificare i dati della carta'
          : 'Payment declined by bank - Please check card details'
      };
    }

    return {
      success: true,
      data: {
        transactionId: `txn-${Date.now()}`,
        amount: context.form.budget,
        currency: 'EUR',
        status: 'approved',
        authorizationCode: Math.random().toString(36).substr(2, 8).toUpperCase()
      }
    };
  }

  /**
   * Final booking confirmation step
   */
  private async executeBookingConfirmation(context: AIContext): Promise<SagaStepResult> {
    await this.simulateApiCall('booking-service');

    return {
      success: true,
      data: {
        bookingId: `BKG-${Date.now()}`,
        confirmationNumber: Math.random().toString(36).substr(2, 9).toUpperCase(),
        status: 'confirmed',
        totalAmount: context.form.budget,
        itinerary: {
          departure: context.form.tripDeparture,
          destination: context.form.tripDestination,
          departureDate: context.form.dateTimeRoundTripDeparture,
          returnDate: context.form.dateTimeRoundTripReturn,
          travelers: context.form.people
        }
      }
    };
  }

  /**
   * Compensation logic - rollback completed steps on failure
   */
  private async compensateTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;

    transaction.status = 'compensating';
    const callback = this.stepCallbacks.get(transactionId);

    // Execute compensations in reverse order
    const completedSteps = [...transaction.completedSteps].reverse();
    
    for (const stepId of completedSteps) {
      try {
        callback?.(`compensation_${stepId}`, 'processing');
        
        await this.executeCompensation(stepId, transaction);
        
        callback?.(`compensation_${stepId}`, 'completed');
        
        await this.delay(200);
        
      } catch (compensationError) {
        console.error(`Compensation failed for step ${stepId}:`, compensationError);
        callback?.(`compensation_${stepId}`, 'error', { 
          error: `Compensation failed: ${compensationError}` 
        });
      }
    }

    transaction.status = 'compensated';
  }

  /**
   * Execute compensation for specific step
   */
  private async executeCompensation(stepId: string, transaction: SagaTransaction): Promise<void> {
    const isItalian = transaction.context.system.userLang === 'Italian';

    switch (stepId) {
      case 'transport_search':
        await this.simulateApiCall('transport-service-cancel');
        console.log(isItalian ? 'Trasporto cancellato' : 'Transport cancelled');
        break;
        
      case 'accommodation_search':
        await this.simulateApiCall('hotel-service-cancel');
        console.log(isItalian ? 'Hotel cancellato' : 'Hotel cancelled');
        break;
        
      case 'payment_processing':
        await this.simulateApiCall('payment-refund');
        console.log(isItalian ? 'Rimborso elaborato' : 'Refund processed');
        break;
        
      case 'booking_confirmation':
        await this.simulateApiCall('booking-cancel');
        console.log(isItalian ? 'Prenotazione cancellata' : 'Booking cancelled');
        break;
        
      default:
        console.log(`No compensation needed for step: ${stepId}`);
    }
  }

  /**
   * Get transaction status
   */
  getTransactionStatus(transactionId: string): SagaTransaction | undefined {
    return this.transactions.get(transactionId);
  }

  /**
   * Cancel ongoing transaction
   */
  async cancelTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;

    if (transaction.status === 'running') {
      await this.compensateTransaction(transactionId);
    }
    
    this.transactions.delete(transactionId);
    this.stepCallbacks.delete(transactionId);
  }

  /**
   * Cleanup completed transactions (memory management)
   */
  cleanupCompletedTransactions(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [id, transaction] of this.transactions.entries()) {
      const transactionAge = now - parseInt(id.split('-')[1]);
      
      if (transactionAge > maxAge && 
          (transaction.status === 'completed' || transaction.status === 'compensated')) {
        this.transactions.delete(id);
        this.stepCallbacks.delete(id);
      }
    }
  }

  // Helper methods

  /**
   * Simulate API call with network delay
   */
  private async simulateApiCall(serviceName: string): Promise<void> {
    console.log(`📡 Calling ${serviceName}...`);
    // , delay: number
    // Simulate network variability
    // const actualDelay = delay + (Math.random() * 500) - 250;
    
    // await this.delay(Math.max(100, actualDelay));
    
    // Simulate occasional network errors (5% chance)
    /*
    if (Math.random() < 0.05) {
      throw new Error(`Network error calling ${serviceName}`);
    }
    */
   
    console.log(`✅ ${serviceName} responded`);
  }

  /**
   * Promise-based delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate transport options for user selection
   */
  private generateTransportOptions(mode: string | undefined, isItalian: boolean) {
    const basePrice = this.calculateTransportPrice(mode, 300);
    
    return [
      {
        id: 'economy',
        label: isItalian ? '🎫 Economica' : '🎫 Economy',
        price: Math.round(basePrice * 0.7),
        details: isItalian ? 'Partenza 08:00 - 1 fermata' : 'Departure 08:00 - 1 stop'
      },
      {
        id: 'standard',
        label: isItalian ? '🎟️ Standard' : '🎟️ Standard', 
        price: basePrice,
        details: isItalian ? 'Partenza 14:30 - Diretto' : 'Departure 14:30 - Direct'
      },
      {
        id: 'premium',
        label: isItalian ? '🎪 Premium' : '🎪 Premium',
        price: Math.round(basePrice * 1.6),
        details: isItalian ? 'Partenza 16:00 - Servizi extra' : 'Departure 16:00 - Extra services'
      }
    ];
  }

  /**
   * Calculate transport price based on mode
   */
  private calculateTransportPrice(mode: string | undefined, baseBudget: number): number {
    if (!mode) return Math.round(baseBudget * 0.4);
    
    const multipliers: Record<string, number> = {
      'plane': 0.6,
      'flight': 0.6,
      'airplane': 0.6,
      'train': 0.3,
      'bus': 0.2,
      'car': 0.25,
      'ship': 0.5,
      'boat': 0.5
    };

    const multiplier = multipliers[mode.toLowerCase()] || 0.4;
    return Math.round(baseBudget * multiplier);
  }

  /**
   * Get retry configuration for failed steps   
  private getRetryConfig(stepId: string): { maxRetries: number; delay: number } {
    const configs: Record<string, { maxRetries: number; delay: number }> = {
      'transport_search': { maxRetries: 3, delay: 1000 },
      'accommodation_search': { maxRetries: 2, delay: 800 },
      'payment_processing': { maxRetries: 1, delay: 2000 },
      'booking_confirmation': { maxRetries: 2, delay: 500 }
    };

    return configs[stepId] || { maxRetries: 1, delay: 1000 };
  }
  */

  /**
   * Execute step with retry logic   
  private async executeStepWithRetry(stepId: string, transaction: SagaTransaction): Promise<SagaStepResult> {
    const { maxRetries, delay } = this.getRetryConfig(stepId);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Retrying ${stepId} (attempt ${attempt + 1}/${maxRetries + 1})`);
          await this.delay(delay * attempt); // Exponential backoff
        }

        return await this.executeStep(stepId, transaction);
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          console.error(`❌ Max retries exceeded for ${stepId}:`, lastError.message);
          break;
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || `Failed after ${maxRetries + 1} attempts`
    };
  }
  */
}

// Singleton instance
export const sagaManager = new BookingSagaManager();

export default BookingSagaManager;
