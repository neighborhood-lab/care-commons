/**
 * Scenario Container
 *
 * Main container for rendering scenario experiences
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Pause, Play } from 'lucide-react';
import { useScenario } from '../ScenarioContext';

export const ScenarioContainer: React.FC = () => {
  const {
    currentScenario,
    currentStep,
    isActive,
    exitScenario,
    restartScenario,
    progress,
  } = useScenario();

  if (!isActive || !currentScenario) {
    return null;
  }

  const step = currentScenario.steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-gradient-to-br from-gray-900 to-gray-800"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">
                  {currentScenario.title}
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1 max-w-md">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {Math.round(progress * 100)}% Complete
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={restartScenario}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Restart Scenario"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
                <button
                  onClick={exitScenario}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Exit Scenario"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="h-[calc(100vh-88px)] overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {step && (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {step.component}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
