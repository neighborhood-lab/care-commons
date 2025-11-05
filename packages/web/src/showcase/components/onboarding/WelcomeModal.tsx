/**
 * Welcome Modal for First-Time Visitors
 *
 * Multi-step onboarding flow that guides new visitors through the showcase
 */

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { personas } from '../../data/personas';

const STORAGE_KEY = 'care-commons-showcase-visited';

// Color mapping for Tailwind classes (must be complete class names)
const colorClasses = {
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-50',
    bgDark: 'bg-purple-100',
    text: 'text-purple-500',
  },
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    bgDark: 'bg-blue-100',
    text: 'text-blue-500',
  },
  green: {
    border: 'border-green-500',
    bg: 'bg-green-50',
    bgDark: 'bg-green-100',
    text: 'text-green-500',
  },
  pink: {
    border: 'border-pink-500',
    bg: 'bg-pink-50',
    bgDark: 'bg-pink-100',
    text: 'text-pink-500',
  },
} as const;

interface WelcomeModalProps {
  onComplete?: (selectedRole?: string) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem(STORAGE_KEY);
    if (!hasVisited) {
      setIsOpen(true);
    }
  }, []);

  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsOpen(false);
    onComplete?.(selectedRole || undefined);
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
    onComplete?.();
  };

  const steps = [
    {
      title: 'Welcome to Care Commons',
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            Welcome to the <strong>Care Commons Interactive Demo</strong>!
            This showcase runs entirely in your browser and demonstrates the full
            capabilities of our community-owned care coordination platform.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What makes this demo special?</h4>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Fully functional in-browser - no server required</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Switch between roles anytime to see different perspectives</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Realistic data and workflows based on real use cases</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Mobile device simulation for caregiver workflows</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Choose Your Journey',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Which perspective would you like to explore first?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {personas.map((persona) => {
              const colors = colorClasses[persona.color as keyof typeof colorClasses] || colorClasses.blue;
              return (
                <button
                  key={persona.id}
                  onClick={() => setSelectedRole(persona.id)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedRole === persona.id
                      ? `${colors.border} ${colors.bg}`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full ${colors.bgDark} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-2xl">
                        {persona.id === 'admin' && '👨‍💼'}
                        {persona.id === 'coordinator' && '👩‍⚕️'}
                        {persona.id === 'caregiver' && '👩‍🔬'}
                        {persona.id === 'patient' && '👵'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{persona.name}</h4>
                      <p className="text-sm text-gray-600">{persona.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{persona.estimatedTime} min experience</p>
                    </div>
                    {selectedRole === persona.id && (
                      <Check className={`h-5 w-5 ${colors.text}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      title: 'Ready to Explore!',
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            {selectedRole ? (
              (() => {
                const persona = personas.find(p => p.id === selectedRole);
                return persona ? (
                  <>You'll start as <strong>{persona.name}</strong> - {persona.title}</>
                ) : (
                  <>You're all set to explore the Care Commons platform!</>
                );
              })()
            ) : (
              <>You're all set to explore the Care Commons platform!</>
            )}
          </p>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-3">Quick Tips:</h4>
            <ul className="space-y-2 text-purple-800 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold">💡</span>
                <span>Use the <strong>Role Switcher</strong> (top right) to change perspectives anytime</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">🔄</span>
                <span>Click <strong>Reset Data</strong> to start fresh with original demo data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">💾</span>
                <span>All changes are saved in your browser - your data won't affect others</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">❓</span>
                <span>Click the <strong>Info</strong> button for help anytime</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dont-show"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="dont-show" className="text-sm text-gray-600">
              Don't show this welcome message again
            </label>
          </div>
        </div>
      ),
    },
  ];

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  if (!currentStepData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
                <p className="text-purple-100 text-sm mt-1">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
              <button
                onClick={handleSkip}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {currentStepData.content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Skip tour
            </button>

            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
              )}

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium transition-colors"
                >
                  Start Exploring
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
