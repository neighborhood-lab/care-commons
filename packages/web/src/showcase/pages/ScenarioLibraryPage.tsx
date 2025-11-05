/**
 * Scenario Library Page
 *
 * Browse and start narrative-driven scenarios
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, User, Award, ArrowRight } from 'lucide-react';
import { allScenarios, scenarioCategories, useScenario } from '../scenarios';
import { Scenario, PersonaRole } from '../types';

export const ScenarioLibraryPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const { startScenario } = useScenario();

  const filteredScenarios = allScenarios.filter(scenario => {
    if (selectedCategory && scenario.category !== selectedCategory) return false;
    if (selectedDifficulty && scenario.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const handleStartScenario = (scenario: Scenario) => {
    startScenario(scenario);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Scenario Library
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience realistic workflows through interactive, narrative-driven scenarios
          </p>
        </motion.div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === null
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-500'
                }`}
              >
                All Categories
              </button>
              {scenarioCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-500'
                  }`}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Difficulty
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDifficulty(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedDifficulty === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
                }`}
              >
                All Levels
              </button>
              {['beginner', 'intermediate', 'advanced'].map(diff => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                    selectedDifficulty === diff
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map((scenario, index) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onStart={() => handleStartScenario(scenario)}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredScenarios.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No scenarios found matching your filters
            </p>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedDifficulty(null);
              }}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
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
  const category = scenarioCategories.find(c => c.id === scenario.category);

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

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
      whileHover={{ scale: 1.02, y: -5 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-500"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r from-${category?.color}-500 to-${category?.color}-600 p-4`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{category?.icon}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${difficultyColors[scenario.difficulty]}`}>
            {scenario.difficulty}
          </span>
        </div>
        <h3 className="text-xl font-bold text-white">{scenario.title}</h3>
      </div>

      {/* Body */}
      <div className="p-6">
        <p className="text-gray-600 mb-4 line-clamp-2">{scenario.description}</p>

        {/* Meta Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{scenario.estimatedTime} minutes</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{roleLabels[scenario.role]}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Award className="h-4 w-4" />
            <span>{scenario.steps.length} steps</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {scenario.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 group"
        >
          <Play className="h-5 w-5" />
          <span>Start Scenario</span>
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};
