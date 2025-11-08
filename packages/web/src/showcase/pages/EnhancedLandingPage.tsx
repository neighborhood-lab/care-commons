/**
 * Enhanced Landing Page for Care Commons Showcase
 *
 * Immersive hero section with animated elements and clear CTAs
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, MapPin, Video, BarChart3, BookOpen } from 'lucide-react';

interface EnhancedLandingPageProps {
  onStartTour?: () => void;
}

export const EnhancedLandingPage: React.FC<EnhancedLandingPageProps> = ({
  onStartTour,
}) => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Play,
      title: 'Interactive Scenarios',
      description: 'Experience realistic care workflows through guided scenarios',
      action: () => navigate('/scenarios'),
      color: 'orange',
    },
    {
      icon: MapPin,
      title: 'Guided Tours',
      description: 'Step-by-step tours of each feature and role',
      action: onStartTour,
      color: 'green',
    },
    {
      icon: Video,
      title: 'Video Walkthroughs',
      description: 'Watch detailed tutorials for each vertical',
      action: () => navigate('/videos'),
      color: 'purple',
    },
    {
      icon: BarChart3,
      title: 'Your Analytics',
      description: 'See how you explore the platform',
      action: () => navigate('/analytics'),
      color: 'blue',
    },
    {
      icon: BookOpen,
      title: 'Documentation',
      description: 'Read the full documentation',
      action: () => {
        const win = window.open('https://docs.care-commons.org', '_blank', 'noopener,noreferrer');
        if (win) win.opener = null;
      },
      color: 'gray',
    },
  ];

  const colorClasses = {
    orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200',
    green: 'bg-green-100 text-green-600 hover:bg-green-200',
    purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
    blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
    gray: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
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
              className="px-8 py-4 bg-gray-900 text-white rounded-lg font-medium text-lg hover:bg-gray-800 transition-colors mb-16"
            >
              Start
            </button>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.button
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    onClick={feature.action}
                    className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-xl transition-all transform hover:-translate-y-1"
                  >
                    <div
                      className={`inline-flex p-3 rounded-lg mb-4 ${colorClasses[feature.color as keyof typeof colorClasses]}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
