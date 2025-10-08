/**
 * TransportOptionsCard.tsx
 * -----------------------
 * Compact component for displaying transport options with user selection.
 * Supports multi-vehicle types with dynamic emoji icons.
 *
 * Author: Edoardo Sabatini
 * Date: 08 October 2025
 */
import React from 'react';

import type { TransportOption } from '../types/saga';

/**
 * Helper function to get transport icon (matches FormBlock.tsx logic)
 */
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

/**
 * Helper function to get readable vehicle name
 */
const getVehicleName = (mode?: string): string => {
  if (!mode) return "option";
  switch (mode.toLowerCase()) {
    case "plane":
    case "flight":
    case "airplane":
      return "flight";
    case "train":
      return "train";
    case "bus":
      return "bus";
    case "car":
      return "car";
    case "ship":
    case "boat":
    case "ferry":
      return "ferry";
    case "bike":
    case "bicycle":
      return "bike";
    case "shuttle":
    case "space shuttle":
    case "spaceship":
    case "rocket":
    case "space":
      return "space shuttle";
    default:
      return "transport";
  }
};

// Compact transport options component
const TransportOptionsCard: React.FC<{
  options: TransportOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  isConfirming: boolean;
  transportMode?: string;
}> = ({ options, selectedId, onSelect, onConfirm, isConfirming, transportMode }) => {
  
  const mode = transportMode || options[0]?.type || 'plane';
  const transportIcon = getTransportIcon(mode);
  const vehicleName = getVehicleName(mode);
  
  return (
    <div className="mt-3 p-3 bg-white rounded-lg border border-orange-200">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
        <span>{transportIcon}</span>
        <span>Select your {vehicleName}:</span>
      </div>
      
      <div className="space-y-2 mb-3">
        {options.map((opt) => (
          <label
            key={opt.id}
            className={`flex items-center gap-3 p-2 rounded border cursor-pointer transition-all ${
              selectedId === opt.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-gray-50'
            }`}
          >
            <input
              type="radio"
              checked={selectedId === opt.id}
              onChange={() => onSelect(opt.id)}
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <span className="truncate">{opt.companyName} {opt.flightNumber}</span>
                {opt.stops === 0 && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                    Direct
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                <span>{opt.departureTime}</span>
                <span>→</span>
                <span>{opt.arrivalTime}</span>
                <span className="text-gray-400">({opt.duration})</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {opt.seatClass} • {opt.benefits[0]}
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-bold text-blue-600">€{opt.price}</div>
              <div className="text-xs text-gray-400">pp</div>
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={onConfirm}
        disabled={!selectedId || isConfirming}
        className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConfirming ? 'Confirming...' : 'Confirm Selection'}
      </button>
    </div>
  );
};

export default TransportOptionsCard;