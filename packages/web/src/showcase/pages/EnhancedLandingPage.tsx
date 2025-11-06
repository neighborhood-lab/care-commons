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
    <div className="min-h-screen bg-warm-bg">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-64 h-64 bg-warm-brown/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-warm-olive/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Main heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-warm-text mb-8">
              Care Commons
            </h1>

            <p className="text-2xl text-warm-textMuted mb-12 max-w-2xl mx-auto leading-relaxed">
              Community-owned care coordination software that respects the people who use it
            </p>

            {/* Single CTA Button */}
            <motion.button
              onClick={onStartTour}
              className="px-10 py-4 bg-warm-accent text-white rounded-lg font-semibold text-lg hover:bg-warm-accentHover transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Explore the Demo
            </motion.button>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <FeatureCard
              title="Client-Centered Care"
              description="Manage client demographics, care plans, and track progress with intuitive tools"
              icon="👥"
            />
            <FeatureCard
              title="Caregiver Support"
              description="Streamline scheduling, time tracking, and communication for your care team"
              icon="💼"
            />
            <FeatureCard
              title="Open Source"
              description="Built transparently by the care community, for the care community"
              icon="🌱"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Feature Card Component
interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => {
  return (
    <div className="bg-warm-bgLight rounded-xl p-6 border border-warm-brown/20 hover:border-warm-accent/40 transition-all">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-warm-text mb-2">{title}</h3>
      <p className="text-warm-textMuted leading-relaxed">{description}</p>
    </div>
  );
};
