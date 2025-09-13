/**
 * ReasoningPanel.tsx
 * AI Reasoning Steps Panel
 * -----------------------
 * Shows the AI's step-by-step thinking process and displays
 * the filled form in a read-only format for demo effect.
 * 
 * Author: Edoardo Sabatini
 * Date: September 13, 2025
 */

import React, { useState, useEffect } from 'react';
import type { AIContext, FillForm } from '../types/chat';
import { formatDateTime } from '../utils/datetime';

interface ReasoningStep {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  details?: string;
  timestamp?: Date;
}

interface ReasoningPanelProps {
  isVisible: boolean;
  isProcessing: boolean;
  currentContext?: AIContext;
  onClose: () => void;
}

const ReasoningPanel: React.FC<ReasoningPanelProps> = ({
  isVisible,
  isProcessing,
  currentContext,
  onClose
}) => {
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([]);
  const [hasCompletedBooking, setHasCompletedBooking] = useState(false);

  // Define all possible reasoning steps
  const allPossibleSteps = {
    input: { emoji: '🔍', title: 'Analyzing user input', details: 'Processing natural language request...' },
    conversation: { emoji: '💬', title: 'Friendly conversation', details: 'Engaging in natural dialogue...' },
    departure: { emoji: '🏠', title: 'Trip departure', details: 'Setting departure location...' },
    destination: { emoji: '🎯', title: 'Trip destination', details: 'Identifying destination...' },
    departureDate: { emoji: '📅', title: 'Departure date', details: 'Processing departure date...' },
    returnDate: { emoji: '🔙', title: 'Return date', details: 'Processing return date...' },
    duration: { emoji: '⏰', title: 'Trip duration', details: 'Calculating stay duration...' },
    transport: { emoji: '🚗', title: 'Travel mode', details: 'Selecting transportation...' },
    budget: { emoji: '💰', title: 'Budget planning', details: 'Understanding financial constraints...' },
    people: { emoji: '👥', title: 'Group size', details: 'Processing traveler count...' },
    hotel: { emoji: '🏨', title: 'Hotel requirements', details: 'Analyzing accommodation needs...' },
    luggage: { emoji: '🧳', title: 'Luggage planning', details: 'Processing baggage requirements...' },
    booking: { emoji: '📋', title: 'Generating booking', details: 'Compiling final travel parameters...' }
  };

  // Generate dynamic steps based on current context
  const generateDynamicSteps = (context?: AIContext): ReasoningStep[] => {
    if (!context) return [];

    const steps: ReasoningStep[] = [];
    const form = context.form;
    const isBookingMode = context.system.bookingSystemEnabled;

    // Always start with input analysis
    steps.push({
      id: 'input',
      title: `${allPossibleSteps.input.emoji} ${allPossibleSteps.input.title}`,
      status: 'completed',
      details: allPossibleSteps.input.details,
      timestamp: new Date()
    });

    if (isBookingMode) {
      // Booking mode - check each field individually
      
      if (form.tripDeparture) {
        steps.push({
          id: 'departure',
          title: `${allPossibleSteps.departure.emoji} ${allPossibleSteps.departure.title} → ${form.tripDeparture}`,
          status: 'processing',
          details: `${allPossibleSteps.departure.details} → ${form.tripDeparture}`
        });
      }

      if (form.tripDestination) {
        steps.push({
          id: 'destination',
          title: `${allPossibleSteps.destination.emoji} ${allPossibleSteps.destination.title} → ${form.tripDestination}`,
          status: 'pending',
          details: `${allPossibleSteps.destination.details} → ${form.tripDestination}`
        });
      }

      if (form.dateTimeRoundTripDeparture) {
        steps.push({
          id: 'departureDate',
          title: `${allPossibleSteps.departureDate.emoji} ${allPossibleSteps.departureDate.title} → ${formatDateTime(new Date(form.dateTimeRoundTripDeparture))}`,
          status: 'pending',
          details: `${allPossibleSteps.departureDate.details} → ${formatDateTime(new Date(form.dateTimeRoundTripDeparture))}`
        });
      }

      if (form.dateTimeRoundTripReturn) {
        steps.push({
          id: 'returnDate',
          title: `${allPossibleSteps.returnDate.emoji} ${allPossibleSteps.returnDate.title} → ${formatDateTime(new Date(form.dateTimeRoundTripReturn))}`,
          status: 'pending',
          details: `${allPossibleSteps.returnDate.details} → ${formatDateTime(new Date(form.dateTimeRoundTripReturn))}`
        });
      }

      if (form.durationOfStayInDays > 0) {
        const dayEmojis = '📅'.repeat(Math.min(form.durationOfStayInDays, 5)); // Max 5 emoji per non esagerare
        steps.push({
          id: 'duration',
          title: `${dayEmojis} ${allPossibleSteps.duration.title} (${form.durationOfStayInDays} days)`,
          status: 'pending',
          details: allPossibleSteps.duration.details
        });
      }

      if (form.travelMode) {
        // Choose emoji based on travel mode
        let modeEmoji = '🚗'; // default
        if (form.travelMode.toLowerCase().includes('plane') || form.travelMode.toLowerCase().includes('fly')) modeEmoji = '✈️';
        else if (form.travelMode.toLowerCase().includes('train')) modeEmoji = '🚆';
        else if (form.travelMode.toLowerCase().includes('bus')) modeEmoji = '🚌';
        else if (form.travelMode.toLowerCase().includes('ship') || form.travelMode.toLowerCase().includes('boat')) modeEmoji = '🚢';
        
        steps.push({
          id: 'transport',
          title: `${modeEmoji} ${allPossibleSteps.transport.title}`,
          status: 'pending',
          details: `${allPossibleSteps.transport.details} → ${form.travelMode}`
        });
      }

      if (form.budget > 0) {
        steps.push({
          id: 'budget',
          title: `${allPossibleSteps.budget.emoji} ${allPossibleSteps.budget.title} (€${form.budget.toLocaleString()})`,
          status: 'pending',
          details: allPossibleSteps.budget.details
        });
      }

      if (form.people > 0) {
        const peopleEmojis = '👤'.repeat(Math.min(form.people, 6)); // Max 6 per non esagerare
        steps.push({
          id: 'people',
          title: `${peopleEmojis} ${allPossibleSteps.people.title} (${form.people})`,
          status: 'pending',
          details: allPossibleSteps.people.details
        });
      }

      if (form.starsOfHotel > 0) {
        const starEmojis = '⭐'.repeat(Math.min(form.starsOfHotel, 5)); // Max 5 stelle
        steps.push({
          id: 'hotel',
          title: `${starEmojis} ${allPossibleSteps.hotel.title} (${form.starsOfHotel} stars)`,
          status: 'pending',
          details: allPossibleSteps.hotel.details
        });
      }

      if (form.luggages > 0) {
        const luggageEmojis = '🧳'.repeat(Math.min(form.luggages, 4)); // Max 4 valigie
        steps.push({
          id: 'luggage',
          title: `${luggageEmojis} ${allPossibleSteps.luggage.title} (${form.luggages})`,
          status: 'pending',
          details: allPossibleSteps.luggage.details
        });
      }

      // Always end with booking if in booking mode and we have at least one field
      const hasAnyField = form.tripDeparture || form.tripDestination || form.budget > 0 || 
                          form.people > 0 || form.starsOfHotel > 0 || form.luggages > 0 ||
                          form.dateTimeRoundTripDeparture || form.dateTimeRoundTripReturn ||
                          form.durationOfStayInDays > 0 || form.travelMode;

      if (hasAnyField) {
        steps.push({
          id: 'booking',
          title: `${allPossibleSteps.booking.emoji} ${allPossibleSteps.booking.title}`,
          status: 'pending',
          details: allPossibleSteps.booking.details
        });
      }

    } else {
      // Conversation mode - just friendly chat
      steps.push({
        id: 'conversation',
        title: `${allPossibleSteps.conversation.emoji} ${allPossibleSteps.conversation.title}`,
        status: 'processing',
        details: allPossibleSteps.conversation.details
      });
    }

    return steps;
  };

  // Initialize and update steps when context changes
  useEffect(() => {
    if (currentContext) {
      const dynamicSteps = generateDynamicSteps(currentContext);
      setReasoningSteps(dynamicSteps);
    }
  }, [currentContext]);

  // Update step status based on form completion
  useEffect(() => {
    if (!currentContext || reasoningSteps.length === 0) return;

    const form = currentContext.form;
    const isBookingMode = currentContext.system.bookingSystemEnabled;
    const formComplete = isFormComplete(form);

    // Track if booking was completed
    if (formComplete && !isBookingMode) {
      setHasCompletedBooking(true);
    }

    setReasoningSteps(prev => prev.map(step => {
      let newStatus: ReasoningStep['status'] = step.status;
      let timestamp = step.timestamp;

      // Always mark input as completed if we have context
      if (step.id === 'input') {
        newStatus = 'completed';
        timestamp = timestamp || new Date();
      }
      
      // Conversation mode logic
      else if (step.id === 'conversation' && !isBookingMode) {
        newStatus = isProcessing ? 'processing' : 'completed';
        if (!isProcessing && !timestamp) timestamp = new Date();
      }
      
      // Booking mode logic - mark as completed based on individual form fields
      else if (isBookingMode) {
        switch (step.id) {
          case 'departure':
            if (form.tripDeparture) {
              newStatus = 'completed';
              timestamp = timestamp || new Date();
            }
            break;
          
          case 'destination':
            if (form.tripDestination) {
              newStatus = 'completed';
              timestamp = timestamp || new Date();
            }
            break;
          
          case 'departureDate':
            if (form.dateTimeRoundTripDeparture) {
              newStatus = 'completed';
              timestamp = timestamp || new Date();
            }
            break;
          
          case 'returnDate':
            if (form.dateTimeRoundTripReturn) {
              newStatus = 'completed';
              timestamp = timestamp || new Date();
            }
            break;
          
          case 'duration':
            if (form.durationOfStayInDays > 0) {
              newStatus = 'completed';
              timestamp = timestamp || new Date();
            }
            break;
          
          case 'transport':
            if (form.travelMode) {
              newStatus = 'completed';
              timestamp = timestamp || new Date();
            }
            break;
          
          case 'budget':
            if (form.budget > 0) {
              newStatus = 'completed';
              timestamp = timestamp || new Date();
            }
            break;
          
          case 'people':
            if (form.people > 0) {
              newStatus = 'completed';
              timestamp = timestamp || new Date();
            }
            break;
          
          case 'hotel':
            if (form.starsOfHotel > 0) {
              newStatus = 'completed';
              timestamp = timestamp || new Date();
            }
            break;
          
          case 'luggage':
            if (form.luggages > 0) {
              newStatus = 'completed';
              timestamp = timestamp || new Date();
            }
            break;
          
          case 'booking':
            if (formComplete) {
              newStatus = 'completed';
              timestamp = timestamp || new Date();
            } else if (!isProcessing) {
              newStatus = 'processing';
            }
            break;
        }
      }

      return { ...step, status: newStatus, timestamp };
    }));
  }, [currentContext, isProcessing, reasoningSteps.length, hasCompletedBooking]);

  // FIXED: Only reset when explicitly closing or when there's no context at all
  useEffect(() => {
    if (!isVisible && !isProcessing && !currentContext) {
      setReasoningSteps([]);
      setHasCompletedBooking(false);
    }
  }, [isVisible, isProcessing, currentContext]);

  const getStatusIcon = (status: ReasoningStep['status']) => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '⚡';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: ReasoningStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600 animate-pulse';
      case 'error': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const isFormComplete = (form: FillForm): boolean => {
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
  };

  // FIXED: Show panel if visible OR if we have completed booking data to show
  const shouldShowPanel = isVisible; // && hasCompletedBooking;
  
  if (!shouldShowPanel) return null;

  return (
    <div className="fixed right-4 top-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[85vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex justify-between items-center">
        <h3 className="font-bold text-lg">🧠 AI Reasoning</h3>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-200 text-xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Reasoning Steps */}
        {reasoningSteps.length > 0 && (
          <div className="p-4 border-b border-gray-100">
            <h4 className="font-semibold text-gray-800 mb-3">Processing Steps:</h4>
            <div className="space-y-3">
              {reasoningSteps.map((step) => (
                <div key={step.id} className="flex items-start gap-3">
                  <span className={`text-lg ${getStatusColor(step.status)}`}>
                    {getStatusIcon(step.status)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${getStatusColor(step.status)}`}>
                      {step.title}
                    </div>
                    {step.status === 'processing' && (
                      <div className="text-xs text-gray-500 mt-1">
                        {step.details}
                      </div>
                    )}
                    {step.timestamp && (
                      <div className="text-xs text-gray-400 mt-1">
                        {step.timestamp.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Preview */}
        {currentContext && isFormComplete(currentContext.form) && (
          <div className="p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              📋 {currentContext.system.userLang === 'Italian' ? 'Dati Viaggio Estratti' : 'Extracted Trip Data'}
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Complete
              </span>
            </h4>
            
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="text-xs text-gray-600 uppercase tracking-wide">
                    {currentContext.system.userLang === 'Italian' ? 'Partenza' : 'Departure'}
                  </div>
                  <div className="font-medium text-gray-900 truncate">
                    {currentContext.form.tripDeparture}
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="text-xs text-gray-600 uppercase tracking-wide">
                    {currentContext.system.userLang === 'Italian' ? 'Destinazione' : 'Destination'}
                  </div>
                  <div className="font-medium text-gray-900 truncate">
                    {currentContext.form.tripDestination}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <div className="text-xs text-blue-600 uppercase tracking-wide">
                    {currentContext.system.userLang === 'Italian' ? 'Data Andata' : 'Departure Date'}
                  </div>
                  <div className="font-medium text-blue-900 text-xs">
                    {formatDateTime(new Date(currentContext.form.dateTimeRoundTripDeparture))}
                  </div>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <div className="text-xs text-blue-600 uppercase tracking-wide">
                    {currentContext.system.userLang === 'Italian' ? 'Data Ritorno' : 'Return Date'}
                  </div>
                  <div className="font-medium text-blue-900 text-xs">
                    {formatDateTime(new Date(currentContext.form.dateTimeRoundTripReturn))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-purple-50 p-2 rounded-lg text-center">
                  <div className="text-xs text-purple-600 uppercase tracking-wide">
                    {currentContext.system.userLang === 'Italian' ? 'Giorni' : 'Days'}
                  </div>
                  <div className="font-bold text-purple-900 text-lg">
                    {currentContext.form.durationOfStayInDays}
                  </div>
                </div>
                <div className="bg-green-50 p-2 rounded-lg text-center">
                  <div className="text-xs text-green-600 uppercase tracking-wide">
                    {currentContext.system.userLang === 'Italian' ? 'Persone' : 'People'}
                  </div>
                  <div className="font-bold text-green-900 text-lg">
                    {currentContext.form.people}
                  </div>
                </div>
                <div className="bg-yellow-50 p-2 rounded-lg text-center">
                  <div className="text-xs text-yellow-600 uppercase tracking-wide">
                    {currentContext.system.userLang === 'Italian' ? 'Stelle' : 'Stars'}
                  </div>
                  <div className="font-bold text-yellow-900 text-lg">
                    {currentContext.form.starsOfHotel}⭐
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <div className="text-xs text-indigo-600 uppercase tracking-wide">
                    {currentContext.system.userLang === 'Italian' ? 'Trasporto' : 'Transport'}
                  </div>
                  <div className="font-medium text-indigo-900 truncate">
                    {currentContext.form.travelMode}
                  </div>
                </div>
                <div className="bg-red-50 p-2 rounded-lg">
                  <div className="text-xs text-red-600 uppercase tracking-wide">
                    Budget
                  </div>
                  <div className="font-medium text-red-900">
                    €{currentContext.form.budget.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <div className="text-xs text-gray-600 uppercase tracking-wide">
                  {currentContext.system.userLang === 'Italian' ? 'Bagagli' : 'Luggage'}
                </div>
                <div className="font-medium text-gray-900">
                  {currentContext.form.luggages} {currentContext.system.userLang === 'Italian' ? 'valigie' : 'suitcases'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No data message */}
        {!isProcessing && reasoningSteps.length === 0 && !hasCompletedBooking && (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">🤔</div>
            <div className="text-sm">
              {currentContext?.system.userLang === 'Italian' 
                ? 'Invia un messaggio per vedere il processo di ragionamento dell\'AI'
                : 'Send a message to see the AI reasoning process'
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReasoningPanel;
