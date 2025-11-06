/**
 * Welcome Modal for First-Time Visitors
 *
 * Simple onboarding for new visitors
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const handleComplete = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsOpen(false);
    onComplete?.();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-warm-bgLight rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-warm-brown/30"
        >
          {/* Header */}
          <div className="bg-warm-bg text-warm-text p-6 border-b border-warm-brown/30">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Welcome to Care Commons</h2>
              <button
                onClick={handleComplete}
                className="text-warm-textMuted hover:text-warm-text transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <p className="text-lg text-warm-textMuted mb-8 leading-relaxed">
              This is an interactive demo of Care Commons, community-owned care coordination software built transparently for home healthcare providers.
            </p>

            <button
              onClick={handleComplete}
              className="w-full px-6 py-3 bg-warm-accent text-white rounded-lg hover:bg-warm-accentHover font-semibold transition-all shadow-md hover:shadow-lg"
            >
              Start Exploring
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
