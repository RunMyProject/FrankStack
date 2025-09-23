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
 * Date: 23 September 2025
 */
import React, { useState, useRef, useEffect } from 'react';
import type { AIContext } from '../types/chat';

/**
 * Emoji selector for transport
 */
const getTransportIcon = (mode?: string): string => {
  if (!mode) return "—";
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
 * Formats a date with 📅 and ⏰
 */
const formatElegantDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `📅 ${date} ⏰ ${time}`;
};

/**
 * Render emoji repetitions with cap + parentheses
 */
const renderWithIcons = (value: number, icon: string, maxReal: number): string => {
  if (value <= 0) return "—";
  const limited = Math.min(value, maxReal);
  return limited > 3 ? `${icon.repeat(3)} (${limited})` : icon.repeat(limited);
};

interface BookingConfirmDialogProps {
  isOpen: boolean;
  bookingContext: AIContext | null;
  onConfirm: () => void;
  onCancel: () => void;
  onModify: (modificationRequest: string) => void;
  onClose?: () => void;
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

  const isItalian = bookingContext?.system.userLang === 'Italian';

  useEffect(() => {
    if (showModifyInput && modifyInputRef.current) {
      modifyInputRef.current.focus();
    }
  }, [showModifyInput]);

  useEffect(() => {
    if (!isOpen) {
      setShowModifyInput(false);
      setModifyText('');
    }
  }, [isOpen]);

  if (!isOpen || !bookingContext) return null;
  const { form } = bookingContext;

  const transportIcon = getTransportIcon(form.travelMode);

  const handleModifySubmit = () => {
    if (modifyText.trim()) {
      const command = isItalian 
        ? `modifica prenotazione: ${modifyText.trim()}`
        : `modify booking: ${modifyText.trim()}`;
      onModify(command);
    }
  };

  const handleModifyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleModifySubmit();
    else if (e.key === 'Escape') {
      setShowModifyInput(false);
      setModifyText('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center">
          <h2 className="text-xl font-bold">
            {transportIcon} {isItalian ? "Conferma Prenotazione" : "Confirm Booking"}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {!showModifyInput ? (
            <>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                {isItalian ? "Riepilogo Viaggio:" : "Trip Summary:"}
              </h3>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4 text-sm">
                <div><span className="font-medium">{isItalian ? "Partenza" : "Departure"}:</span> {form.tripDeparture}</div>
                <div><span className="font-medium">{isItalian ? "Destinazione" : "Destination"}:</span> {form.tripDestination}</div>
                <div><span className="font-medium">{isItalian ? "Data andata" : "Departure Date"}:</span> {formatElegantDate(form.dateTimeRoundTripDeparture)}</div>
                <div><span className="font-medium">{isItalian ? "Data ritorno" : "Return Date"}:</span> {formatElegantDate(form.dateTimeRoundTripReturn)}</div>
                <div><span className="font-medium">{isItalian ? "Giorni" : "Days"}:</span> {form.durationOfStayInDays}</div>
                <div><span className="font-medium">{isItalian ? "Trasporto" : "Transport"}:</span> {transportIcon}</div>
                <div><span className="font-medium">Budget:</span> €{form.budget}</div>
                <div><span className="font-medium">{isItalian ? "Persone" : "People"}:</span> {renderWithIcons(form.people, "👤", 10)}</div>
                <div><span className="font-medium">{isItalian ? "Stelle Hotel" : "Hotel Stars"}:</span> {renderWithIcons(form.starsOfHotel, "⭐", 7)}</div>
                <div><span className="font-medium">{isItalian ? "Bagagli" : "Luggages"}:</span> {renderWithIcons(form.luggages, "🧳", 10)}</div>
              </div>

              <div className="text-center mt-6">
                <p className="text-gray-700">
                  {isItalian 
                    ? "Confermi di voler procedere con questa prenotazione?" 
                    : "Do you want to proceed with this booking?"}
                </p>
              </div>
            </>
          ) : (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                {isItalian ? "Modifica Prenotazione:" : "Modify Booking:"}
              </h3>
              <input
                ref={modifyInputRef}
                type="text"
                value={modifyText}
                onChange={(e) => setModifyText(e.target.value)}
                onKeyDown={handleModifyKeyDown}
                placeholder={isItalian ? "Scrivi cosa vuoi modificare..." : "Write what you want to modify..."}
                className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-sm text-gray-500 mt-2">
                {isItalian ? "Premi Invio per inviare, Esc per annullare" : "Press Enter to send, Esc to cancel"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          {!showModifyInput ? (
            <div className="flex gap-2 justify-center flex-wrap">
              <button onClick={onConfirm} className="px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:scale-105 hover:shadow-lg transition-all font-semibold text-sm">
                {isItalian ? "✅ Prenota Pure!" : "✅ Book It!"}
              </button>
              <button onClick={() => setShowModifyInput(true)} className="px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:scale-105 hover:shadow-lg transition-all font-semibold text-sm">
                {isItalian ? "✏️ Modifica" : "✏️ Modify"}
              </button>
              <button onClick={onCancel} className="px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:scale-105 hover:shadow-lg transition-all font-semibold text-sm">
                {isItalian ? "❌ Ci Ho Ripensato" : "❌ Changed My Mind"}
              </button>
              <button onClick={onClose || (() => {})} className="px-5 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 hover:scale-105 transition-all font-semibold text-sm">
                {isItalian ? "✖️ Annulla" : "✖️ Close"}
              </button>
            </div>
          ) : (
            <div className="flex gap-3 justify-center">
              <button onClick={handleModifySubmit} disabled={!modifyText.trim()} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:scale-105 hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:hover:scale-100">
                {isItalian ? "Invia Modifica" : "Send Modification"}
              </button>
              <button onClick={() => { setShowModifyInput(false); setModifyText(""); }} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 hover:scale-105 transition-all font-semibold">
                {isItalian ? "Annulla" : "Cancel"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmDialog;
