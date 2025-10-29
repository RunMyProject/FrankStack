/**
 * SagaStepRow.tsx
 * -----------------------
 * Visualizes a single step of a Saga flow.
 * Shows name, description, status icon, optional error message,
 * and an optional user selection UI (radio + confirm) for transport, hotel, and payment.
 * Bilingual labels (Italian / English) and Tailwind-based styling.
 *
 * AUTHOR: Edoardo Sabatini
 * DATE: 29 October 2025
 */

import React from 'react';
import type { TransportOption, HotelOption, HotelBookingEntry, BookingEntry } from '../types/saga';
import type { SagaStep } from '../types/saga';
import TransportOptionsCard from './TransportOptionsCard';
import HotelOptionsCard from './HotelOptionsCard';
import PaymentOptionsCard from './PaymentOptionsCard';

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

// Helper function to get star emojis (max 7 stars)
const getStarsDisplay = (stars: number): string => {
  const maxStars = 7;
  const limitedStars = Math.min(stars, maxStars);
  return limitedStars > 3 ? `⭐⭐⭐ (${limitedStars})` : `⭐`.repeat(limitedStars);
};

type SagaStepRowProps = {
  step: SagaStep;
  options?: (TransportOption | HotelOption)[];
  selectedOption: string;
  onSelectOption: (id: string) => void;
  onConfirmOption: (param?: unknown) => void;
  isConfirming: boolean;
  transportMode?: string;
  totalAmount?: number;
};

// Single saga step row component
const SagaStepRow: React.FC<SagaStepRowProps> = ({ 
  step, options, selectedOption, onSelectOption, onConfirmOption, isConfirming, transportMode, totalAmount = 0
}) => {
    
  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed': 
        // If this is the completed transport step with data, show transport icon
        if (step.id === 'service-b' && step.bookingEntry?.type) {
          return getTransportIcon(step.bookingEntry.type);
        }
        // If this is the completed hotel step with stars
        if (step.id === 'service-c' && step.bookingEntry && 'stars' in step.bookingEntry) {
          return getStarsDisplay((step.bookingEntry as HotelBookingEntry).stars);
        }
        // If this is the completed payment step
        if (step.id === 'service-d') {
          return '✅';
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
    if (step.status !== 'completed' || !step.bookingEntry) return null;

    // Don't show booking details for service-a (orchestrator step)
    if (step.id === 'service-a') {
      return null;
    }

    // Don't show booking details for service-d (payment step)
    if (step.id === 'service-d') {
      return null;
    }

    const bookingData = step.bookingEntry;
    
    // Check if this is a hotel booking (has hotelName property)
    if ('hotelName' in bookingData) {
      const hotelData = bookingData as HotelBookingEntry;
      return (
        <div className="mt-2 p-2 bg-white rounded border border-purple-200">
          <div className="text-xs text-purple-800">
            <div className="font-medium flex items-center gap-1">
              {hotelData.hotelName}
              {hotelData.stars && <span className="text-xs">{getStarsDisplay(hotelData.stars)}</span>}
            </div>
            <div>Check-in: {formatDate(hotelData.dateTimeRoundTripDeparture)}</div>
            <div>Check-out: {formatDate(hotelData.dateTimeRoundTripReturn)}</div>
            <div className="font-semibold mt-1">€{hotelData.price}</div>
            {hotelData.roomType && <div className="text-xs mt-0.5">{hotelData.roomType}</div>}
            {hotelData.amenities && (
              <div className="text-xs mt-0.5 text-gray-600">
                {hotelData.amenities.slice(0, 3).join(', ')}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Otherwise it's a transport booking (has type property)
    const transportData = bookingData as BookingEntry;

    return (
      <div className="mt-2 p-2 bg-white rounded border border-green-200">
        <div className="text-xs text-green-800 grid grid-cols-2 gap-1">
          <div className="font-medium">Company: {transportData.companyName}</div>
          <div><span className="font-medium">Ref:</span> {transportData.reference}</div>
          <div><span className="font-medium">Route:</span> {transportData.tripDeparture} → {transportData.tripDestination}</div>
          <div><span className="font-medium">Departure:</span> {formatDate(transportData.dateTimeRoundTripDeparture)}</div>
          <div><span className="font-medium">Return:</span> {formatDate(transportData.dateTimeRoundTripReturn)}</div>
          <div><span className="font-medium">People:</span> {transportData.people}</div>
          <div><span className="font-medium">Luggage:</span> {transportData.luggages}</div>
          <div className="font-semibold pt-1 col-span-2 border-t border-green-100">
            <span className="font-medium">Cost:</span> €{transportData.price}
          </div>
        </div>
      </div>
    );
  };

  // Render invoice download link if available
  const renderInvoiceDownload = () => {
    if (step.status !== 'completed' || step.id !== 'service-d' || !step.invoiceUrl) {
      return null;
    }

    const handleOpenPdf = () => {
      if (step.invoiceUrl) {
        window.open(step.invoiceUrl, '_blank', 'noopener,noreferrer');
      }
    };

    return (
      <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📄</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Invoice Ready</p>
                <p className="text-xs text-gray-600">Your payment receipt is available</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleOpenPdf}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    );
  };

  // Main component return
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

          {step.status === 'user_input_required' && (
            <>
              {step.id === 'service-b' && options ? (
                <TransportOptionsCard
                  options={options as TransportOption[]}
                  selectedId={selectedOption}
                  onSelect={onSelectOption}
                  onConfirm={onConfirmOption}
                  isConfirming={isConfirming}
                  transportMode={transportMode}
                />
              ) : step.id === 'service-c' && options ? (
                <HotelOptionsCard
                  options={options as HotelOption[]}
                  selectedId={selectedOption}
                  onSelect={onSelectOption}
                  onConfirm={onConfirmOption}
                  isConfirming={isConfirming}
                />
              ) : step.id === 'service-d' ? (
                <PaymentOptionsCard
                  totalAmount={totalAmount}
                  selectedPaymentId={selectedOption}
                  onSelect={onSelectOption}
                  onConfirm={onConfirmOption}
                  isConfirming={isConfirming}
                />
              ) : null}
            </>
          )}
          {renderBookingDetails()}          
          {renderInvoiceDownload()}
        </div>
      </div>
    </div>
  );
};

export default SagaStepRow;
