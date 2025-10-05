/**
 * SagaStepRow.tsx
 * -----------------------
 * Visualizes a single step of a Saga flow.
 * Shows name, description, status icon, optional error message,
 * and an optional user selection UI (radio + confirm).
 * Bilingual labels (Italian / English) and Tailwind-based styling.
 *
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

import React from 'react';

import type { TransportOption } from '../types/saga';
import type { SagaStep } from '../types/saga';
import TransportOptionsCard from './TransportOptionsCard';

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
      case 'completed': return '✅';
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
        </div>
      </div>
    </div>
  );
};

export default SagaStepRow;
