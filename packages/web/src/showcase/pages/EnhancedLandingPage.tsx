/**
 * Enhanced Landing Page for Care Commons Showcase
 *
 * Immersive hero section with animated elements and clear CTAs
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Globe, Users } from 'lucide-react';
import { personas } from '../data/personas';

interface EnhancedLandingPageProps {
  onSelectRole: (roleId: string) => void;
  onStartTour?: () => void;
}

export const EnhancedLandingPage: React.FC<EnhancedLandingPageProps> = ({
  onSelectRole,
  onStartTour,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Logo/Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-block mb-6"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                Interactive Demo
              </div>
            </motion.div>

            {/* Main heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              <span className="block">Welcome to</span>
              <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Care Commons
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Community-owned care coordination software built for{' '}
              <span className="font-semibold text-gray-900">home healthcare agencies</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={onStartTour}
                className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                Start Interactive Tour
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="https://github.com/neighborhood-lab/care-commons"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
              >
                View on GitHub
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <StatCard
                value="70%"
                label="Reduction in EVV violations"
                icon={<Shield className="h-6 w-6" />}
                delay={0.3}
              />
              <StatCard
                value="100+"
                label="Daily visits managed"
                icon={<Users className="h-6 w-6" />}
                delay={0.4}
              />
              <StatCard
                value="24/7"
                label="Offline-capable mobile app"
                icon={<Zap className="h-6 w-6" />}
                delay={0.5}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Value Propositions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Shield className="h-8 w-8" />}
            title="EVV Compliance Made Easy"
            description="Automatic GPS verification, geofencing, and six-element capture for seamless state compliance"
            color="purple"
          />
          <FeatureCard
            icon={<Globe className="h-8 w-8" />}
            title="Multi-State Support"
            description="Pre-configured rules for Texas, Florida, and 48 other states with automatic aggregator submission"
            color="blue"
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Works Offline"
            description="Caregivers can work in dead zones and sync automatically when connection is restored"
            color="green"
          />
        </div>
      </div>

      {/* Choose Your Journey */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Journey
            </h2>
            <p className="text-xl text-gray-600">
              Explore the platform from different perspectives
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {personas.map((persona, index) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                onClick={() => onSelectRole(persona.id)}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Experience Care Commons?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Start exploring the platform with our interactive demo
          </p>
          <button
            onClick={onStartTour}
            className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Begin Your Journey
          </button>
        </div>
      </div>
    </div>
  );
};

// Supporting Components

interface StatCardProps {
  value: string;
  label: string;
  icon: React.ReactNode;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white rounded-lg shadow-md p-6 text-center"
  >
    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full mb-4">
      <div className="text-purple-600">{icon}</div>
    </div>
    <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </motion.div>
);

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
  >
    <div className={`inline-flex items-center justify-center w-16 h-16 bg-${color}-100 rounded-lg mb-4`}>
      <div className={`text-${color}-600`}>{icon}</div>
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

interface PersonaCardProps {
  persona: any;
  onClick: () => void;
  delay: number;
}

const PersonaCard: React.FC<PersonaCardProps> = ({ persona, onClick, delay }) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.05, y: -5 }}
    onClick={onClick}
    className="bg-white rounded-xl shadow-md p-6 text-left hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-500"
  >
    <div className={`w-16 h-16 rounded-full bg-${persona.color}-100 flex items-center justify-center mb-4`}>
      <span className="text-3xl">
        {persona.id === 'admin' && '👨‍💼'}
        {persona.id === 'coordinator' && '👩‍⚕️'}
        {persona.id === 'caregiver' && '👩‍🔬'}
        {persona.id === 'patient' && '👵'}
      </span>
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{persona.name}</h3>
    <p className="text-sm text-gray-600 mb-3">{persona.title}</p>
    <div className={`inline-block px-3 py-1 bg-${persona.color}-100 text-${persona.color}-700 rounded-full text-xs font-semibold mb-3`}>
      {persona.estimatedTime} min experience
    </div>
    <p className="text-sm text-gray-500 mb-3">{persona.missionTitle}</p>
    <div className="flex items-center text-purple-600 font-medium text-sm">
      Start exploring
      <ArrowRight className="h-4 w-4 ml-1" />
    </div>
  </motion.button>
);

// Add animations to global CSS or Tailwind config
const style = document.createElement('style');
style.textContent = `
  @keyframes blob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(20px, -50px) scale(1.1); }
    50% { transform: translate(-20px, 20px) scale(0.9); }
    75% { transform: translate(50px, 50px) scale(1.05); }
  }

  .animate-blob {
    animation: blob 7s infinite;
  }

  .animation-delay-2000 {
    animation-delay: 2s;
  }
`;
document.head.appendChild(style);
