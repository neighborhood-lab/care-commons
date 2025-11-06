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
    <div className="min-h-screen bg-warm-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold text-warm-text mb-4">
            Scenarios
          </h1>
          <p className="text-xl text-warm-textMuted">
            Explore real-world care coordination workflows
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
      className="bg-warm-bgLight rounded-lg border border-warm-brown/20 hover:border-warm-accent/40 transition-all p-6 hover:shadow-lg"
    >
      <h3 className="text-xl font-bold text-warm-text mb-2">{scenario.title}</h3>
      <p className="text-warm-textMuted mb-4">{roleLabels[scenario.role]}</p>

      {/* Start Button */}
      <button
        onClick={onStart}
        className="w-full px-6 py-3 bg-warm-accent text-white rounded-lg font-semibold hover:bg-warm-accentHover transition-all shadow-md hover:shadow-lg"
      >
        Start Scenario
      </button>
    </motion.div>
  );
};
