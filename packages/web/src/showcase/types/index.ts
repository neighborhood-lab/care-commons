/**
 * Type definitions for Care Commons Showcase
 */

export type PersonaRole = 'admin' | 'coordinator' | 'caregiver' | 'patient';

export interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
  validation?: () => boolean;
  highlightElement?: boolean;
  showProgress?: boolean;
  isInteractive?: boolean;
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  role: PersonaRole;
  estimatedTime: number; // minutes
  steps: TourStep[];
  onComplete?: () => void;
}

export interface Persona {
  id: PersonaRole;
  name: string;
  title: string;
  description: string;
  avatar?: string;
  missionTitle: string;
  missionDescription: string;
  estimatedTime: number; // minutes
  features: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  color: string; // Tailwind color class
}

export interface ScenarioStep {
  id: string;
  component: React.ReactNode;
  narration: string;
  actions: string[];
  nextOnAction?: string;
  validation?: () => boolean;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  category: 'emergency' | 'operations' | 'compliance' | 'financial';
  role: PersonaRole;
  estimatedTime: number;
  steps: ScenarioStep[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export interface DeviceConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  hasNotch: boolean;
  type: 'phone' | 'tablet';
}

export interface FeatureComparison {
  category: string;
  items: {
    feature: string;
    showcase: string;
    fullDemo: string;
    icon?: React.ComponentType;
  }[];
}
