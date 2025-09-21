/**
 * StatusBlock.tsx
 * Step Status Display Component
 * -----------------------
 * Displays step status with icons:
 *   - ⚙️ spinning for ongoing steps
 *   - 🏁 intermediate completed steps
 *   - ✅ final completed step
 *   - ❌ error
 *   - ⏳ pending
 *
 * Author: Edoardo Sabatini
 * Date: September 21, 2025
 */

import React, { useState, useEffect } from "react";

interface Step {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed" | "error";
  details?: string;
}

interface Props {
  steps: Step[];
  isProcessing: boolean;
}

interface StepIconState {
  phase: "rotating" | "done" | "error" | "pending" | "final";
}

const StatusBlock: React.FC<Props> = ({ steps, isProcessing }) => {
  const [icons, setIcons] = useState<Record<string, StepIconState>>({});

  useEffect(() => {
    setIcons(prev => {
      const updated: Record<string, StepIconState> = { ...prev };

      steps.forEach((step, index) => {
        // Step error → ❌
        if (step.status === "error") {
          updated[step.id] = { phase: "error" };
        }

        // Step completed → final ✅
        else if (step.status === "completed") {
          updated[step.id] = { phase: "final" };
        }

        // Otherwise, initialize as rotating
        else if (!updated[step.id]) {
          updated[step.id] = { phase: "rotating" };
        }

        // Mark previous step done 🏁 if it was rotating and not final
        if (index > 0) {
          const prevStep = steps[index - 1];
          if (prevStep.status !== "completed" && updated[prevStep.id]?.phase === "rotating") {
            updated[prevStep.id] = { phase: "done" };
          }
        }
      });

      return updated;
    });
  }, [steps]);

  const getIcon = (state: StepIconState) => {
    switch (state.phase) {
      case "rotating": return "⚙️";
      case "done": return "🏁";
      case "final": return "✅";
      case "error": return "❌";
      case "pending": return "⏳";
      default: return "⏳";
    }
  };

  return (
    <div className="p-6 border-b border-gray-100 bg-white">
      {steps.map(step => (
        <div key={step.id} className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{step.details}</div>
          </div>
          <span className={`text-lg ${icons[step.id]?.phase === "rotating" ? "animate-spin-fast" : ""}`}>
            {icons[step.id] ? getIcon(icons[step.id]) : "⏳"}
          </span>
        </div>
      ))}

      {steps.length === 0 && isProcessing && (
        <div className="text-sm text-gray-500 mt-3">Processing…</div>
      )}

      <style>
        {`
          @keyframes spin-fast {
            0% { transform: rotate(0deg); }
            50% { transform: rotate(180deg); }
            100% { transform: rotate(360deg); }
          }
          .animate-spin-fast {
            display: inline-block;
            animation: spin-fast 0.7s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default StatusBlock;
