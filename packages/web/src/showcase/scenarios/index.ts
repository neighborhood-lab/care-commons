/**
 * Scenario Exports
 *
 * Central export for all scenarios and scenario utilities
 */

export { ScenarioProvider, useScenario } from './ScenarioContext';
export { ScenarioContainer } from './components/ScenarioContainer';
export { NarrationBox } from './components/NarrationBox';
export { ActionButtons } from './components/ActionButtons';

export { crisisResponseScenario } from './CrisisResponseScenario';
export { clientOnboardingScenario } from './ClientOnboardingScenario';

import { Scenario, PersonaRole } from '../types';
import { crisisResponseScenario } from './CrisisResponseScenario';
import { clientOnboardingScenario } from './ClientOnboardingScenario';

/**
 * All available scenarios
 */
export const allScenarios: Scenario[] = [
  crisisResponseScenario,
  clientOnboardingScenario,
];

/**
 * Get scenario by ID
 */
export const getScenarioById = (id: string): Scenario | undefined => {
  return allScenarios.find(scenario => scenario.id === id);
};

/**
 * Get scenarios by role
 */
export const getScenariosByRole = (role: PersonaRole): Scenario[] => {
  return allScenarios.filter(scenario => scenario.role === role);
};

/**
 * Get scenarios by category
 */
export const getScenariosByCategory = (
  category: 'emergency' | 'operations' | 'compliance' | 'financial'
): Scenario[] => {
  return allScenarios.filter(scenario => scenario.category === category);
};

/**
 * Get scenarios by difficulty
 */
export const getScenariosByDifficulty = (
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Scenario[] => {
  return allScenarios.filter(scenario => scenario.difficulty === difficulty);
};

/**
 * Scenario categories with metadata
 */
export const scenarioCategories = [
  {
    id: 'emergency' as const,
    name: 'Emergency Response',
    description: 'Time-sensitive situations requiring immediate action',
    color: 'red',
    icon: '🚨',
  },
  {
    id: 'operations' as const,
    name: 'Daily Operations',
    description: 'Typical day-to-day workflows and processes',
    color: 'blue',
    icon: '📋',
  },
  {
    id: 'compliance' as const,
    name: 'Compliance & Regulatory',
    description: 'Meeting federal and state requirements',
    color: 'green',
    icon: '✅',
  },
  {
    id: 'financial' as const,
    name: 'Financial Operations',
    description: 'Billing, payroll, and revenue cycle',
    color: 'purple',
    icon: '💰',
  },
];
