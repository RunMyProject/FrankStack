/**
 * SagaStepRow.tsx
 * -----------------------
 * Visualizes a single step of a Saga flow.
 * Shows name, description, status icon, optional error message,
 * and an optional user selection UI (radio + confirm).
 * Bilingual labels (Italian / English) and Tailwind-based styling.
 *
 * Author: Edoardo Sabatini
 * Date: 25 September 2025
 */
import React from 'react';

// Step data shape
export interface SagaStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'user_input_required';
  errorMessage?: string;
  data?: unknown;
  requiresUserSelection?: boolean;
  options?: Array<{ id: string; label: string; price?: number; details?: string; }>;
}

// Component props
interface SagaStepRowProps {
  step: SagaStep;
  isItalian: boolean;
  showUserSelection: boolean;
  selectedOption: string;
  setSelectedOption: (value: string) => void;
  handleUserSelection: () => void;
}

/**
 * Renders a single saga step with status icon and optional user input UI.
 */
export const SagaStepRow: React.FC<SagaStepRowProps> = ({
  step,
  isItalian,
  showUserSelection,
  selectedOption,
  setSelectedOption,
  handleUserSelection
}) => {
  // Choose emoji icon based on status
  const getStepIcon = (step: SagaStep) => {
    switch (step.status) {
      case 'processing': return '⚙️';
      case 'completed': return '✅';
      case 'error': return '❌';
      case 'user_input_required': return '👆';
      default: return '⏳';
    }
  };

  // Add spinning class when processing
  const getStepIconClass = (step: SagaStep) => {
    return step.status === 'processing' ? 'animate-spin' : '';
  };

  // Main container: border and bg change with status
  return (
    <div className={`mb-4 p-4 rounded-xl border-2 transition-all ${
      step.status === 'processing' ? 'border-blue-300 bg-blue-50' :
      step.status === 'completed' ? 'border-green-300 bg-green-50' :
      step.status === 'error' ? 'border-red-300 bg-red-50' :
      step.status === 'user_input_required' ? 'border-orange-300 bg-orange-50' :
      'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Step title */}
          <div className="font-semibold text-sm text-gray-800">{step.name}</div>

          {/* Step description */}
          <div className="text-xs text-gray-600 mt-1">{step.description}</div>

          {/* Optional error message */}
          {step.errorMessage && (
            <div className="text-xs text-red-600 mt-2">❌ {step.errorMessage}</div>
          )}
        </div>

        {/* Status icon (may animate) */}
        <span className={`text-xl ml-3 ${getStepIconClass(step)}`}>
          {getStepIcon(step)}
        </span>
      </div>

      {/* User selection area: shown only when required and allowed */}
      {step.requiresUserSelection && showUserSelection && step.options && (
        <div className="mt-4 p-4 bg-white rounded-lg border">
          {/* Section title (Italian / English) */}
          <h4 className="font-medium text-sm mb-3">
            {isItalian ? 'Seleziona un\'opzione:' : 'Select an option:'}
          </h4>

          <div className="space-y-2">
            {/* Each option as a radio row */}
            {step.options.map((option) => (
              <label key={option.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="radio"
                  name="transport_option"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  className="mr-3"
                />
                <div className="flex-1">
                  {/* Option label */}
                  <div className="font-medium text-sm">{option.label}</div>

                  {/* Optional price */}
                  {option.price && (
                    <div className="text-xs text-green-600">€{option.price}</div>
                  )}

                  {/* Optional details */}
                  {option.details && (
                    <div className="text-xs text-gray-500">{option.details}</div>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* Confirm button (disabled until an option is selected) */}
          <button
            onClick={handleUserSelection}
            disabled={!selectedOption}
            className="w-full mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isItalian ? 'Conferma Selezione' : 'Confirm Selection'}
          </button>
        </div>
      )}
    </div>
  );
};
