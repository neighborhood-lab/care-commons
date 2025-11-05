/**
 * Tour Overlay Component
 *
 * Displays the tour UI with spotlight effect highlighting elements
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  SkipForward,
} from 'lucide-react';
import { useTour } from './TourContext';

interface ElementPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const TourOverlay: React.FC = () => {
  const {
    currentTour,
    currentStep,
    isActive,
    nextStep,
    previousStep,
    skipTour,
    pauseTour,
    resumeTour,
    isPaused,
    progress,
  } = useTour();

  const [targetPosition, setTargetPosition] = useState<ElementPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = currentTour?.steps[currentStep];

  // Update target element position
  useEffect(() => {
    if (!step?.target || !isActive) {
      setTargetPosition(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setTargetPosition(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [step?.target, isActive, currentStep]);

  // Calculate tooltip position based on placement
  useEffect(() => {
    if (!targetPosition || !tooltipRef.current || !step) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const padding = 20;
    let top = 0;
    let left = 0;

    switch (step.placement) {
      case 'top':
        top = targetPosition.top - tooltipRect.height - padding;
        left = targetPosition.left + targetPosition.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = targetPosition.top + targetPosition.height + padding;
        left = targetPosition.left + targetPosition.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = targetPosition.top + targetPosition.height / 2 - tooltipRect.height / 2;
        left = targetPosition.left - tooltipRect.width - padding;
        break;
      case 'right':
        top = targetPosition.top + targetPosition.height / 2 - tooltipRect.height / 2;
        left = targetPosition.left + targetPosition.width + padding;
        break;
    }

    // Keep tooltip within viewport
    const maxLeft = window.innerWidth - tooltipRect.width - 20;
    const maxTop = window.innerHeight - tooltipRect.height - 20;
    left = Math.max(20, Math.min(left, maxLeft));
    top = Math.max(20, Math.min(top, maxTop));

    setTooltipPosition({ top, left });
  }, [targetPosition, step]);

  if (!isActive || !currentTour || !step) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Backdrop with spotlight effect */}
        {step.highlightElement && targetPosition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-60 pointer-events-auto"
            style={{
              maskImage: `radial-gradient(
                transparent ${Math.max(targetPosition.width, targetPosition.height) / 2 + 10}px,
                black ${Math.max(targetPosition.width, targetPosition.height) / 2 + 30}px
              )`,
              maskPosition: `${targetPosition.left + targetPosition.width / 2}px ${targetPosition.top + targetPosition.height / 2}px`,
              maskRepeat: 'no-repeat',
            }}
          />
        )}

        {/* Highlight border */}
        {step.highlightElement && targetPosition && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="absolute border-4 border-blue-500 rounded-lg shadow-2xl pointer-events-none"
            style={{
              top: targetPosition.top - 8,
              left: targetPosition.left - 8,
              width: targetPosition.width + 16,
              height: targetPosition.height + 16,
            }}
          >
            {/* Pulsing animation */}
            <motion.div
              className="absolute inset-0 border-4 border-blue-400 rounded-lg"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        )}

        {/* Tour Step Tooltip */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: 1,
            y: 0,
            ...(tooltipPosition && {
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }),
          }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bg-white rounded-xl shadow-2xl max-w-md pointer-events-auto"
          style={tooltipPosition ? { position: 'fixed' } : undefined}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                {step.showProgress !== false && (
                  <p className="text-sm text-purple-100 mt-1">
                    Step {currentStep + 1} of {currentTour.steps.length}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <button
                    onClick={resumeTour}
                    className="p-1 text-white hover:text-gray-200 transition-colors"
                    title="Resume Tour"
                  >
                    <Play className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    onClick={pauseTour}
                    className="p-1 text-white hover:text-gray-200 transition-colors"
                    title="Pause Tour"
                  >
                    <Pause className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={skipTour}
                  className="p-1 text-white hover:text-gray-200 transition-colors"
                  title="Exit Tour"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-1.5 bg-white bg-opacity-20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 leading-relaxed">{step.content}</p>

            {step.isInteractive && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  👆 Complete the action to continue
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl flex items-center justify-between">
            <button
              onClick={skipTour}
              className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors flex items-center gap-1"
            >
              <SkipForward className="h-4 w-4" />
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={previousStep}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
              )}

              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                {currentStep < currentTour.steps.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Complete
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Paused Overlay */}
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center pointer-events-auto"
          >
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tour Paused</h3>
              <p className="text-gray-600 mb-6">
                The tour is paused. Click resume when you're ready to continue.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={resumeTour}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="h-5 w-5" />
                  Resume Tour
                </button>
                <button
                  onClick={skipTour}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                >
                  Exit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};
