/**
 * BookingConfirmDialog.tsx
 * Booking Confirmation Dialog Component
 * -----------------------
 * Modal dialog for confirming or canceling a booking request.
 * Shows booking details and provides options to:
 * - Confirm booking
 * - Cancel booking  
 * - Modify booking (with input field)
 *
 * Author: Assistant (for Edoardo Sabatini)
 * Date: 21 September 2025
 */

import React, { useState, useRef, useEffect } from 'react';
import type { AIContext } from '../types/chat';
import { formatDateTime } from '../utils/datetime';

interface BookingConfirmDialogProps {
  isOpen: boolean;
  bookingContext: AIContext | null;
  onConfirm: () => void;
  onCancel: () => void;
  onModify: (modificationRequest: string) => void;
  onClose?: () => void; // Optional simple close without any action
}

const BookingConfirmDialog: React.FC<BookingConfirmDialogProps> = ({
  isOpen,
  bookingContext,
  onConfirm,
  onCancel,
  onModify,
  onClose
}) => {
  const [showModifyInput, setShowModifyInput] = useState(false);
  const [modifyText, setModifyText] = useState('');
  const modifyInputRef = useRef<HTMLInputElement>(null);

  // Get current language
  const isItalian = bookingContext?.system.userLang === 'Italian';

  // Focus on modify input when shown
  useEffect(() => {
    if (showModifyInput && modifyInputRef.current) {
      modifyInputRef.current.focus();
    }
  }, [showModifyInput]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setShowModifyInput(false);
      setModifyText('');
    }
  }, [isOpen]);

  if (!isOpen || !bookingContext) return null;

  const { form } = bookingContext;

  const handleModifyClick = () => {
    setShowModifyInput(true);
  };

  const handleModifySubmit = () => {
    if (modifyText.trim()) {
      const command = isItalian 
        ? `modifica prenotazione: ${modifyText.trim()}`
        : `modify booking: ${modifyText.trim()}`;
      onModify(command);
    }
  };

  const handleModifyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleModifySubmit();
    } else if (e.key === 'Escape') {
      setShowModifyInput(false);
      setModifyText('');
    }
  };

  // Booking summary content
  const bookingSummary = isItalian ? (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Partenza:</span>
        <span className="font-semibold">{form.tripDeparture}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Destinazione:</span>
        <span className="font-semibold">{form.tripDestination}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Data andata:</span>
        <span className="font-semibold">
          {formatDateTime(new Date(form.dateTimeRoundTripDeparture))}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Data ritorno:</span>
        <span className="font-semibold">
          {formatDateTime(new Date(form.dateTimeRoundTripReturn))}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Durata (giorni):</span>
        <span className="font-semibold">{form.durationOfStayInDays}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Mezzo di trasporto:</span>
        <span className="font-semibold">{form.travelMode}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Budget:</span>
        <span className="font-semibold">€{form.budget}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Persone:</span>
        <span className="font-semibold">{form.people}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Stelle hotel:</span>
        <span className="font-semibold">{form.starsOfHotel} ⭐</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Valigie:</span>
        <span className="font-semibold">{form.luggages}</span>
      </div>
    </div>
  ) : (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Departure:</span>
        <span className="font-semibold">{form.tripDeparture}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Destination:</span>
        <span className="font-semibold">{form.tripDestination}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Departure date:</span>
        <span className="font-semibold">
          {formatDateTime(new Date(form.dateTimeRoundTripDeparture))}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Return date:</span>
        <span className="font-semibold">
          {formatDateTime(new Date(form.dateTimeRoundTripReturn))}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Duration (days):</span>
        <span className="font-semibold">{form.durationOfStayInDays}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Travel mode:</span>
        <span className="font-semibold">{form.travelMode}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Budget:</span>
        <span className="font-semibold">€{form.budget}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">People:</span>
        <span className="font-semibold">{form.people}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Hotel stars:</span>
        <span className="font-semibold">{form.starsOfHotel} ⭐</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Luggages:</span>
        <span className="font-semibold">{form.luggages}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h2 className="text-xl font-bold text-center">
            {isItalian ? '✈️ Conferma Prenotazione' : '✈️ Confirm Booking'}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {!showModifyInput ? (
            <>
              {/* Booking Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  {isItalian ? 'Riepilogo Viaggio:' : 'Trip Summary:'}
                </h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  {bookingSummary}
                </div>
              </div>

              {/* Confirmation Message */}
              <div className="text-center mb-6">
                <p className="text-gray-700">
                  {isItalian 
                    ? 'Confermi di voler procedere con questa prenotazione?' 
                    : 'Do you want to proceed with this booking?'
                  }
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Modify Input Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  {isItalian ? 'Modifica Prenotazione:' : 'Modify Booking:'}
                </h3>
                <div className="space-y-4">
                  <input
                    ref={modifyInputRef}
                    type="text"
                    value={modifyText}
                    onChange={(e) => setModifyText(e.target.value)}
                    onKeyDown={handleModifyKeyDown}
                    placeholder={isItalian 
                      ? 'Scrivi cosa vuoi modificare...' 
                      : 'Write what you want to modify...'
                    }
                    className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                  />
                  <p className="text-sm text-gray-500">
                    {isItalian 
                      ? 'Premi Invio per inviare, Esc per annullare' 
                      : 'Press Enter to send, Esc to cancel'
                    }
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-gray-200 p-6">
          {!showModifyInput ? (
            <div className="flex gap-2 justify-center flex-wrap">
              {/* Confirm Button */}
              <button
                onClick={onConfirm}
                className="px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:scale-105 hover:shadow-lg transition-all font-semibold text-sm"
              >
                {isItalian ? '✅ Prenota Pure!' : '✅ Book It!'}
              </button>

              {/* Modify Button */}
              <button
                onClick={handleModifyClick}
                className="px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:scale-105 hover:shadow-lg transition-all font-semibold text-sm"
              >
                {isItalian ? '✏️ Modifica' : '✏️ Modify'}
              </button>

              {/* Cancel Button */}
              <button
                onClick={onCancel}
                className="px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:scale-105 hover:shadow-lg transition-all font-semibold text-sm"
              >
                {isItalian ? '❌ Ci Ho Ripensato' : '❌ Changed My Mind'}
              </button>

              {/* Simple Close Button (NEW) */}
              <button
                onClick={onClose || (() => {})}
                className="px-5 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 hover:scale-105 transition-all font-semibold text-sm"
              >
                {isItalian ? '✖️ Annulla' : '✖️ Close'}
              </button>
            </div>
          ) : (
            <div className="flex gap-3 justify-center">
              {/* Send Modification */}
              <button
                onClick={handleModifySubmit}
                disabled={!modifyText.trim()}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:scale-105 hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:hover:scale-100"
              >
                {isItalian ? 'Invia Modifica' : 'Send Modification'}
              </button>

              {/* Cancel Modification */}
              <button
                onClick={() => {
                  setShowModifyInput(false);
                  setModifyText('');
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 hover:scale-105 transition-all font-semibold"
              >
                {isItalian ? 'Annulla' : 'Cancel'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmDialog;