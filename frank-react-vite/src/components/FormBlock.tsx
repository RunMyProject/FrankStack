/**
 * FormBlock.tsx
 * Trip Data Form Display Component
 * -----------------------
 * Displays extracted trip information including dates, transport, budget, 
 * and trip statistics in a structured and visually styled format.
 *
 * Provides:
 *   - Icons for transport and dates
 *   - Statistics with optional icon repetition (people, stars, luggages)
 *   - Multi-language support (Italian/English)
 *
 * Author: Edoardo Sabatini
 * Date: September 21, 2025
 */

import React from "react";
import type { FillForm } from "../types/chat";

/**
 * Component props
 */
interface Props {
  form: FillForm;       // Data object containing extracted trip information
  complete: boolean;    // Indicates if the trip data is considered complete
  lang: string;         // Current UI language ("Italian" or "English")
}

/**
 * FormBlock Component
 * Main display wrapper for trip data
 */
const FormBlock: React.FC<Props> = ({ form, complete, lang }) => {
  const isItalian = lang === "Italian";

  /**
   * Returns an emoji icon based on transport mode
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
   * Formats date string into elegant date + time with icons
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
    return `📅 ${date}\n⏰ ${time}`;
  };

  return (
    <div className="p-4">
      {/* Header with title and completion badge */}
      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        📋 {isItalian ? "Dati Viaggio Estratti" : "Extracted Trip Data"}
        {complete && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            {isItalian ? "Completo" : "Complete"}
          </span>
        )}
      </h4>

      {/* Trip data blocks */}
      <div className="space-y-3 text-sm">
        {/* Departure / Destination */}
        <div className="grid grid-cols-2 gap-3">
          <Box label={isItalian ? "Partenza" : "Departure"} value={form.tripDeparture} />
          <Box label={isItalian ? "Destinazione" : "Destination"} value={form.tripDestination} />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <Box
            label={isItalian ? "Data Andata" : "Departure Date"}
            value={formatElegantDate(form.dateTimeRoundTripDeparture)}
            color="blue"
            alignLeft
            fixedHeight
          />
          <Box
            label={isItalian ? "Data Ritorno" : "Return Date"}
            value={formatElegantDate(form.dateTimeRoundTripReturn)}
            color="blue"
            alignLeft
            fixedHeight
          />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox label={isItalian ? "Giorni" : "Days"} value={form.durationOfStayInDays || 0} color="purple" />
          <StatBox label={isItalian ? "Persone" : "People"} value={form.people || 0} color="green" suffix="👤" maxReal={10} />
          <StatBox label={isItalian ? "Stelle" : "Stars"} value={form.starsOfHotel || 0} color="yellow" suffix="⭐" maxReal={7} />
        </div>

        {/* Transport and budget */}
        <div className="grid grid-cols-2 gap-3">
          <Box label={isItalian ? "Trasporto" : "Transport"} value={getTransportIcon(form.travelMode)} color="indigo" alignLeft />
          <Box label="Budget" value={form.budget > 0 ? `€${form.budget.toLocaleString()}` : "—"} color="red" alignLeft />
        </div>

        {/* Luggages */}
        <StatBox label={isItalian ? "Bagagli" : "Luggage"} value={form.luggages || 0} color="gray" suffix="🧳" maxReal={10} />
      </div>
    </div>
  );
};

/**
 * Box component
 * Generic labeled block with flexible styles
 */
interface BoxProps {
  label: string;
  value: string | number | undefined;
  color?: string;
  alignLeft?: boolean;
  fixedHeight?: boolean;
}

const Box: React.FC<BoxProps> = ({ label, value, color, alignLeft, fixedHeight }) => {
  const colorClasses =
    color === "blue"
      ? "bg-blue-50 text-blue-900"
      : color === "indigo"
      ? "bg-indigo-50 text-indigo-900"
      : color === "red"
      ? "bg-red-50 text-red-900"
      : "bg-gray-50 text-gray-900";

  return (
    <div className={`${colorClasses} p-2 rounded-lg ${fixedHeight ? "h-20" : ""}`}>
      <div className={`text-xs uppercase tracking-wide ${color ? `text-${color}-600` : "text-gray-600"}`}>
        {label}
      </div>
      <div className={`font-medium truncate ${alignLeft ? "text-left" : "text-center"} whitespace-pre-line`}>
        {value || "—"}
      </div>
    </div>
  );
};

/**
 * Helper: render icons for repeated values (e.g. people, stars, luggages)
 */
const renderWithIcons = (value: number, icon: string, maxReal: number): string => {
  if (value <= 0) return "—";
  const limited = Math.min(value, maxReal);
  return limited > 3 ? `${icon.repeat(3)} (${limited})` : icon.repeat(limited);
};

/**
 * StatBox component
 * Specialized box for numerical statistics with optional icon representation
 */
interface StatBoxProps {
  label: string;
  value: number | string;
  color: string;
  suffix?: string;
  maxReal?: number;
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, color, suffix, maxReal }) => {
  const colorClasses =
    color === "purple"
      ? "bg-purple-50 text-purple-900"
      : color === "green"
      ? "bg-green-50 text-green-900"
      : color === "yellow"
      ? "bg-yellow-50 text-yellow-900"
      : "bg-gray-50 text-gray-900";

  let displayValue: string | number = value;
  if (typeof value === "number" && suffix && maxReal) {
    displayValue = renderWithIcons(value, suffix, maxReal);
  } else if (value === 0 || value === "—") {
    displayValue = "—";
  }

  return (
    <div className={`${colorClasses} p-2 rounded-lg text-center`}>
      <div className="text-xs uppercase tracking-wide text-gray-600">{label}</div>
      <div className="font-bold text-lg">{displayValue}</div>
    </div>
  );
};

export default FormBlock;
