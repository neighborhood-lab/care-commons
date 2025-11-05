/**
 * Action Buttons Component
 *
 * Interactive action buttons for scenario choices
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { useScenario } from '../ScenarioContext';

interface ActionButtonsProps {
  actions: string[];
  onAction?: (actionId: string) => void;
  showPrevious?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  actions,
  onAction,
  showPrevious = true,
}) => {
  const { nextStep, previousStep, currentStep } = useScenario();

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action);
    }
    nextStep(action);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-medium text-purple-200 mb-2">
        👉 What would you do?
      </div>
      <div className="grid gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAction(action)}
            className="group bg-white rounded-lg p-4 text-left hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-900 font-medium">{action}</span>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.button>
        ))}
      </div>

      {showPrevious && currentStep > 0 && (
        <button
          onClick={previousStep}
          className="mt-4 flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Go back
        </button>
      )}
    </div>
  );
};
