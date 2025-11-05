/**
 * Tour Button Component
 *
 * Floating action button to start tours
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, X, Play } from 'lucide-react';
import { useTour } from '../../tours/TourContext';
import { allTours, getRecommendedTour } from '../../tours';
import { PersonaRole } from '../../types';

interface TourButtonProps {
  currentRole?: PersonaRole;
}

export const TourButton: React.FC<TourButtonProps> = ({ currentRole }) => {
  const { startTour, isActive } = useTour();
  const [showMenu, setShowMenu] = useState(false);

  // Don't show button if tour is active
  if (isActive) return null;

  const handleStartTour = (tourId: string) => {
    const tour = allTours.find(t => t.id === tourId);
    if (tour) {
      startTour(tour);
      setShowMenu(false);
    }
  };

  const handleQuickStart = () => {
    if (currentRole) {
      const tour = getRecommendedTour(currentRole);
      if (tour) {
        startTour(tour);
      }
    } else {
      setShowMenu(true);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 right-0 bg-white rounded-xl shadow-2xl p-4 w-72"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">Start a Tour</h3>
              <button
                onClick={() => setShowMenu(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Choose a tour to explore different features:
            </p>

            <div className="space-y-2">
              {allTours.map((tour) => (
                <button
                  key={tour.id}
                  onClick={() => handleStartTour(tour.id)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                      <Play className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                        {tour.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {tour.estimatedTime} min • {tour.steps.length} steps
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={handleQuickStart}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-shadow flex items-center justify-center"
        title="Start Interactive Tour"
      >
        <Compass className="h-7 w-7" />
      </motion.button>

      {/* Expand Menu Button (shows when there's a recommended tour) */}
      {currentRole && (
        <motion.button
          onClick={() => setShowMenu(!showMenu)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute -top-2 -left-2 w-8 h-8 bg-white border-2 border-purple-600 text-purple-600 rounded-full shadow-lg flex items-center justify-center text-xs font-bold"
          title="See all tours"
        >
          {allTours.length}
        </motion.button>
      )}
    </div>
  );
};
