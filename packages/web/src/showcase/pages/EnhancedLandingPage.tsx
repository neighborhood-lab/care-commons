/**
 * Enhanced Landing Page for Care Commons Showcase
 *
 * Immersive hero section with animated elements and clear CTAs
 */

import React from 'react';
import { motion } from 'framer-motion';

interface EnhancedLandingPageProps {
  onStartTour?: () => void;
}

export const EnhancedLandingPage: React.FC<EnhancedLandingPageProps> = ({
  onStartTour,
}) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Main heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-8">
              Care Commons
            </h1>

            <p className="text-2xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Care coordination for home healthcare
            </p>

            {/* Single CTA Button */}
            <button
              onClick={onStartTour}
              className="px-8 py-4 bg-gray-900 text-white rounded-lg font-medium text-lg hover:bg-gray-800 transition-colors"
            >
              Start
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
