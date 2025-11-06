/**
 * Welcome Modal for First-Time Visitors
 *
 * Multi-step onboarding flow that guides new visitors through the showcase
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { personas } from '../../data/personas';
import { PersonaRole } from '../../types';

const STORAGE_KEY = 'care-commons-showcase-visited';


interface WelcomeModalProps {
  onComplete?: (selectedRole?: string) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(() => {
    // Check if user has visited before on initial render
    if (typeof window !== 'undefined') {
      const hasVisited = window.localStorage.getItem(STORAGE_KEY);
      return !hasVisited;
    }
    return false;
  });
  const [currentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<PersonaRole | null>(null);

  const handleComplete = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsOpen(false);
    onComplete?.(selectedRole ?? undefined);
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsOpen(false);
    onComplete?.();
  };

  const steps = [
    {
      title: 'Welcome',
      content: (
        <div className="space-y-6">
          <p className="text-gray-700">
            Care coordination platform demo
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {personas.map((persona) => {
              return (
                <button
                  key={persona.id}
                  onClick={() => setSelectedRole(persona.id)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedRole === persona.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">
                        {persona.id === 'admin' && '👨‍💼'}
                        {persona.id === 'coordinator' && '👩‍⚕️'}
                        {persona.id === 'caregiver' && '👩‍🔬'}
                        {persona.id === 'patient' && '👵'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{persona.name}</h4>
                      <p className="text-sm text-gray-500">{persona.title}</p>
                    </div>
                  </div>
                </button>
              );
            })}
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
          <div className="bg-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{currentStepData.title}</h2>
              <button
                onClick={handleSkip}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
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
          <div className="border-t border-gray-200 p-6 flex items-center justify-end">
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Start
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
