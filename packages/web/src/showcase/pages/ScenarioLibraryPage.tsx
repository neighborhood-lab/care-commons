/**
 * Scenario Library Page
 *
 * Browse and start narrative-driven scenarios
 */

import React from 'react';
import { motion } from 'framer-motion';
import { allScenarios, useScenario } from '../scenarios';
import { Scenario, PersonaRole } from '../types';

export const ScenarioLibraryPage: React.FC = () => {
  const { startScenario } = useScenario();

  const handleStartScenario = (scenario: Scenario) => {
    startScenario(scenario);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Scenarios
          </h1>
          <p className="text-xl text-gray-600">
            Explore workflows
          </p>
        </motion.div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allScenarios.map((scenario, index) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onStart={() => handleStartScenario(scenario)}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Supporting Components

interface ScenarioCardProps {
  scenario: Scenario;
  onStart: () => void;
  delay: number;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onStart, delay }) => {
  const roleLabels: Record<PersonaRole, string> = {
    admin: 'Administrator',
    coordinator: 'Care Coordinator',
    caregiver: 'Caregiver',
    patient: 'Patient/Family',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-lg border-2 border-gray-200 hover:border-gray-900 transition-all p-6"
    >
      <h3 className="text-xl font-bold text-gray-900 mb-2">{scenario.title}</h3>
      <p className="text-gray-600 mb-4">{roleLabels[scenario.role]}</p>

      {/* Start Button */}
      <button
        onClick={onStart}
        className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
      >
        Start
      </button>
    </motion.div>
  );
};
