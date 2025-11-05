/**
 * Feature Carousel Component
 *
 * Auto-playing carousel showcasing key platform features
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Shield, Globe, Zap, Users, FileCheck, Clock } from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
  color: string;
}

const features: Feature[] = [
  {
    id: 'evv-compliance',
    title: 'EVV Compliance Made Easy',
    description: 'Automatic GPS verification, geofencing, and six-element capture for seamless state compliance across all 50 states.',
    icon: Shield,
    tags: ['Compliance', 'GPS', 'Automated'],
    color: 'blue',
  },
  {
    id: 'multi-state',
    title: 'Multi-State Support',
    description: 'Pre-configured rules for Texas, Florida, and 48 other states with automatic aggregator submission and state-specific requirements.',
    icon: Globe,
    tags: ['Configuration', 'Scalable', 'Nationwide'],
    color: 'green',
  },
  {
    id: 'offline-first',
    title: 'Works Without Internet',
    description: 'Caregivers can work in dead zones and sync automatically when connection is restored. No internet? No problem.',
    icon: Zap,
    tags: ['Mobile', 'Reliability', 'Offline'],
    color: 'yellow',
  },
  {
    id: 'real-time-tracking',
    title: 'Real-Time Visit Monitoring',
    description: 'Live GPS tracking of all active visits with geofence validation and instant alerts for exceptions or concerns.',
    icon: Clock,
    tags: ['Operations', 'GPS', 'Monitoring'],
    color: 'purple',
  },
  {
    id: 'care-coordination',
    title: 'Streamlined Care Coordination',
    description: 'Unified platform for client management, caregiver scheduling, care planning, and family communication.',
    icon: Users,
    tags: ['Coordination', 'Scheduling', 'Communication'],
    color: 'pink',
  },
  {
    id: 'compliance-audit',
    title: 'Audit-Ready Documentation',
    description: 'Comprehensive audit trails, HIPAA access logs, and regulatory reports ready for state and federal audits.',
    icon: FileCheck,
    tags: ['Compliance', 'HIPAA', 'Auditing'],
    color: 'indigo',
  },
];

export const FeatureCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % features.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const currentFeature = features[currentIndex];
  const Icon = currentFeature.icon;

  return (
    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Main Content */}
      <div className="relative h-96 flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFeature.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-${currentFeature.color}-500 mb-6`}
            >
              <Icon className="h-12 w-12 text-white" />
            </motion.div>

            {/* Title */}
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {currentFeature.title}
            </h3>

            {/* Description */}
            <p className="text-lg text-gray-300 mb-6">
              {currentFeature.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap justify-center gap-2">
              {currentFeature.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-white bg-opacity-10 text-white rounded-full text-sm backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 text-white rounded-full backdrop-blur-sm transition-all"
          aria-label="Previous feature"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 text-white rounded-full backdrop-blur-sm transition-all"
          aria-label="Next feature"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {features.map((feature, index) => (
          <button
            key={feature.id}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-white'
                : 'w-2 bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
            aria-label={`Go to ${feature.title}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      {isAutoPlaying && (
        <motion.div
          key={currentIndex}
          className="absolute bottom-0 left-0 h-1 bg-white"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, ease: 'linear' }}
        />
      )}
    </div>
  );
};
