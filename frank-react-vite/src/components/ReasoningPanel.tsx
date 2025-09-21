/**
 * ReasoningPanel.tsx
 * AI Reasoning Panel Component
 * -----------------------
 * Provides a side panel to display the AI reasoning process:
 *   - Shows current trip form data (FormBlock)
 *   - Displays status updates over time (StatusBlock)
 *   - Indicates booking system availability
 *   - Supports cancel/reset logic for the AI context form
 *
 * Author: Edoardo Sabatini
 * Date: September 21, 2025
 */

import React, { useEffect, useState } from "react";
import ReasoningPanelBase from "./ReasoningPanelBase";
import StatusBlock from "./StatusBlock";
import FormBlock from "./FormBlock";
import type { AIContext, AIStatus } from "../types/chat";

/**
 * Component props
 */
interface Props {
  isVisible: boolean;       // Controls panel visibility
  isProcessing: boolean;    // Whether AI is currently processing
  currentContext?: AIContext; // Current AI context data
  onClose: () => void;      // Handler for panel close
  aiStatus: AIStatus;       // Current AI status object
}

/**
 * Status step object
 */
interface Step {
  id: string;               // Unique step identifier
  label: string;            // Step label (short title)
  status: "pending" | "processing" | "completed" | "error"; // Step state
  details?: string;         // Optional descriptive message
  timestamp?: Date;         // Timestamp of update
}

/**
 * ReasoningPanel Component
 * Wraps FormBlock and StatusBlock inside ReasoningPanelBase
 */
const ReasoningPanel: React.FC<Props> = ({
  isVisible,
  isProcessing,
  currentContext,
  onClose,
  aiStatus,
}) => {
  const [statusSteps, setStatusSteps] = useState<Step[]>([]);
  const bookingSystemEnabled = currentContext?.system.bookingSystemEnabled;

  useEffect(() => {
    // Reset steps when new process starts and no message yet
    if (aiStatus.msg == null && isProcessing) {
      setStatusSteps([]);
    }

    // Reset form fields when cancel status is triggered
    if (aiStatus.status === "cancel") {
      if (currentContext) {
        currentContext.form = {
          tripDeparture: currentContext.form.tripDeparture,
          tripDestination: "",
          dateTimeRoundTripDeparture: "",
          dateTimeRoundTripReturn: "",
          durationOfStayInDays: 0,
          travelMode: "",
          budget: 0,
          people: 0,
          starsOfHotel: 0,
          luggages: 0,
        };
      }
    }

    // Append new status update when a message is available
    if (aiStatus?.msg) {
      setStatusSteps((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length}`,
          label: "🔍 Status update",
          status: isProcessing ? "processing" : "completed",
          details: aiStatus.msg,
          timestamp: new Date(),
        },
      ]);
    }
  }, [aiStatus, isProcessing, currentContext]);

  // Determine whether form is marked as completed
  const formComplete = aiStatus?.msg === "Completed ✅";

  if (!isVisible) return null;

  return (
    <ReasoningPanelBase title="🧠 AI Reasoning" onClose={onClose}>
      <div className="flex flex-col gap-3 p-4 w-full max-w-3xl mx-auto overflow-x-hidden">
        {/* Form section with booking badge */}
        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
          <div className="absolute top-4 right-4 my-1 mx-4 px-3 py-1 rounded-full text-xs text-white bg-green-500/30">
            {bookingSystemEnabled ? "🟢 " : "🔴 "} Booking
          </div>
          {currentContext?.form && (
            <FormBlock
              form={currentContext.form}
              complete={formComplete}
              lang={currentContext.system?.userLang ?? "EN"}
            />
          )}
        </div>

        {/* Status updates section */}
        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm max-h-[200px] overflow-y-auto">
          <StatusBlock steps={statusSteps} isProcessing={isProcessing} />
        </div>
      </div>
    </ReasoningPanelBase>
  );
};

export default ReasoningPanel;
