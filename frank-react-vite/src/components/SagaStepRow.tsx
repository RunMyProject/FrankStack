/**
 * SagaStepRow.tsx
 * -----------------------
 * Visualizes a single step of a Saga flow.
 * Shows name, description, status icon, optional error message,
 * and an optional user selection UI (radio + confirm).
 * Bilingual labels (Italian / English) and Tailwind-based styling.
 *
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */

import React from 'react';

import type { TransportOption } from '../types/saga';
import type { SagaStep } from '../types/saga';
import TransportOptionsCard from './TransportOptionsCard';

// Helper function to get transport icon (matches FormBlock.tsx logic)
const getTransportIcon = (mode?: string): string => {
  if (!mode) return "❓";
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
    case "ship":
    case "boat":
    case "ferry":
      return "🛳️";
    case "bike":
    case "bicycle":
      return "🚴‍♂️";
    case "shuttle":
    case "space shuttle":
    case "spaceship":
    case "rocket":
    case "space":
      return "🚀";
    default:
      return "❓";
  }
};

type SagaStepRowProps = {
  step: SagaStep;
  options?: TransportOption[];
  selectedOption: string;
  onSelectOption: (id: string) => void;
  onConfirmOption: () => void;
  isConfirming: boolean;
  transportMode?: string;
};

// Single saga step row component
const SagaStepRow: React.FC<SagaStepRowProps> = ({ 
  step, options, selectedOption, onSelectOption, onConfirmOption, isConfirming, transportMode 
}) => {
    
  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed': 
        // If this is the completed transport step with data, show transport icon
        if (step.id === 'service-b' && step.data?.bookingEntry?.type) {
          return getTransportIcon(step.data.bookingEntry.type);
        }
        return '✅';
      case 'processing': return '⚙️';
      case 'error': return '❌';
      case 'user_input_required': return '🔍';
      default: return '⏳';
    }
  };

  const getStatusColor = () => {
    switch (step.status) {
      case 'completed': return 'border-green-200 bg-green-50';
      case 'processing': return 'border-blue-200 bg-blue-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'user_input_required': return 'border-orange-200 bg-orange-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  // Render detailed booking info when step is completed and has data
  const renderBookingDetails = () => {
    if (step.status !== 'completed' || !step.data) return null;

    // Check if this is transport booking with detailed data
    const bookingEntry = step.data.bookingEntry || step.data;
    
    if (bookingEntry.reference && bookingEntry.type) {
      // Find the selected option to get the company name
      let companyName = bookingEntry.companyName || bookingEntry.airline || 'N/A';
      if (options && selectedOption) {
        const selectedOpt = options.find(opt => opt.id === selectedOption);
        if (selectedOpt) {
          companyName = selectedOpt.airline || selectedOpt.companyName || companyName;
        }
      }
      
      return (
        <div className="mt-2 p-2 bg-white rounded border border-green-200">
          <div className="text-xs text-green-800 grid grid-cols-2 gap-1">
            <div className="font-medium">Company: {companyName}</div>
            <div><span className="font-medium">Ref:</span> {bookingEntry.reference}</div>
            <div><span className="font-medium">Route:</span> {bookingEntry.tripDeparture} → {bookingEntry.tripDestination}</div>
            <div><span className="font-medium">Departure:</span> {formatDate(bookingEntry.dateTimeRoundTripDeparture)}</div>
            <div><span className="font-medium">Return:</span> {formatDate(bookingEntry.dateTimeRoundTripReturn)}</div>
            <div><span className="font-medium">People:</span> {bookingEntry.people}</div>
            <div><span className="font-medium">Luggage:</span> {bookingEntry.luggages}</div>
            <div className="font-semibold pt-1 col-span-2 border-t border-green-100">
              <span className="font-medium">Cost:</span> €{bookingEntry.price}
            </div>
          </div>
        </div>
      );
    }

    // For accommodation or other types
    if (step.data.name || step.data.hotelName) {
      return (
        <div className="mt-2 p-2 bg-white rounded border border-green-200">
          <div className="text-xs text-green-800">
            <div className="font-medium">{step.data.name || step.data.hotelName}</div>
            <div>Check-in: {formatDate(step.data.checkInDate || step.data.startDate)}</div>
            <div>Check-out: {formatDate(step.data.checkOutDate || step.data.endDate)}</div>
            <div className="font-semibold mt-1">€{step.data.price}</div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`mb-3 p-3 rounded-lg border-2 transition-all ${getStatusColor()}`}>
      <div className="flex items-start gap-3">
        <span className={`text-xl flex-shrink-0 ${step.status === 'processing' ? 'animate-spin' : ''}`}>
          {getStatusIcon()}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-800">{step.name}</h3>
          <p className="text-xs text-gray-600 mt-0.5">{step.description}</p>
          
          {step.errorMessage && (
            <p className="text-xs text-red-600 mt-1">⚠️ {step.errorMessage}</p>
          )}

          {step.status === 'user_input_required' && options && (
            <TransportOptionsCard
              options={options}
              selectedId={selectedOption}
              onSelect={onSelectOption}
              onConfirm={onConfirmOption}
              isConfirming={isConfirming}
              transportMode={transportMode}
            />
          )}

          {renderBookingDetails()}
        </div>
      </div>
    </div>
  );
};

export default SagaStepRow;
