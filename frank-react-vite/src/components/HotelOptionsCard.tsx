/**
 * HotelOptionsCard.tsx
 * -----------------------
 * Compact component for displaying hotel options with user selection.
 * Supports star ratings and hotel amenities.
 *
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */

import React from 'react';
import type { HotelOption } from '../types/saga';

/**
 * Helper function to get star emojis for display (max 7)
 */
const getStarsDisplay = (stars: number): string => {
  const maxStars = 7;
  const limitedStars = Math.min(stars, maxStars);
  return limitedStars > 3 ? `⭐⭐⭐ (${limitedStars})` : `⭐`.repeat(limitedStars);
};

// Compact hotel options component
const HotelOptionsCard: React.FC<{
  options: HotelOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  isConfirming: boolean;
}> = ({ options, selectedId, onSelect, onConfirm, isConfirming }) => {
  
  return (
    <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
        <span>🏨</span>
        <span>Select your accommodation:</span>
      </div>
      
      <div className="space-y-2 mb-3">
        {options.map((opt) => (
          <label
            key={opt.id}
            className={`flex items-start gap-3 p-2 rounded border cursor-pointer transition-all ${
              selectedId === opt.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300 bg-gray-50'
            }`}
          >
            <input
              type="radio"
              checked={selectedId === opt.id}
              onChange={() => onSelect(opt.id)}
              className="flex-shrink-0 mt-1"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <span className="truncate">{opt.name}</span>
                <span className="flex-shrink-0 text-xs">{getStarsDisplay(opt.stars)}</span>
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                {opt.address}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                <span>DepartureTime: {opt.departureTime}</span>
                <span>→</span>
                <span>ArrivalTime: {opt.arrivalTime}</span>
                <span className="text-gray-400">({opt.duration} nights)</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {opt.roomType} • {opt.amenities.slice(0, 2).join(' • ')}
              </div>
              {opt.rating && (
                <div className="text-xs text-blue-600 mt-0.5">
                  Rating: {opt.rating}/10
                </div>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-bold text-purple-600">€{opt.price}</div>
              <div className="text-xs text-gray-400">total</div>
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={onConfirm}
        disabled={!selectedId || isConfirming}
        className="w-full py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConfirming ? 'Confirming Hotel...' : 'Confirm Hotel Selection'}
      </button>
    </div>
  );
};

export default HotelOptionsCard;
