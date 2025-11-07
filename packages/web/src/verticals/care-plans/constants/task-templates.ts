import type { TaskTemplate } from '../types';

/**
 * Common task templates to speed up care plan creation
 */

export const COMMON_TASK_TEMPLATES: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Medication Management
  {
    name: 'Morning Medications',
    description: 'Administer morning medications per schedule',
    category: 'MEDICATION',
    frequency: {
      pattern: 'DAILY',
      timesPerDay: 1,
      specificTimes: ['08:00'],
    },
    estimatedDuration: 15,
    timeOfDay: ['EARLY_MORNING'],
    instructions: 'Review medication list, verify correct dosages, administer with food/water as required, document administration',
    steps: [
      {
        stepNumber: 1,
        description: 'Review medication list and verify client identity',
        isRequired: true,
        estimatedDuration: 2,
        safetyNotes: 'Confirm client name and date of birth',
      },
      {
        stepNumber: 2,
        description: 'Check medication labels and expiration dates',
        isRequired: true,
        estimatedDuration: 3,
        safetyNotes: 'Do not administer expired medications',
      },
      {
        stepNumber: 3,
        description: 'Administer medications with appropriate food/water',
        isRequired: true,
        estimatedDuration: 5,
      },
      {
        stepNumber: 4,
        description: 'Document administration and observe for reactions',
        isRequired: true,
        estimatedDuration: 5,
      },
    ],
    requiresSignature: true,
    requiresNote: true,
    requiresPhoto: false,
    isOptional: false,
    allowSkip: false,
    status: 'ACTIVE',
  },

  // Vital Signs
  {
    name: 'Daily Vital Signs Check',
    description: 'Check and record vital signs (BP, pulse, temperature)',
    category: 'MONITORING',
    frequency: {
      pattern: 'DAILY',
      timesPerDay: 1,
    },
    estimatedDuration: 15,
    timeOfDay: ['MORNING'],
    instructions: 'Measure blood pressure, pulse rate, and temperature. Record all readings and note any abnormalities.',
    requiresSignature: false,
    requiresNote: true,
    requiresPhoto: false,
    requiresVitals: true,
    isOptional: false,
    allowSkip: false,
    status: 'ACTIVE',
  },

  // Personal Care
  {
    name: 'Morning Personal Care',
    description: 'Assist with morning personal hygiene routine',
    category: 'PERSONAL_HYGIENE',
    frequency: {
      pattern: 'DAILY',
      timesPerDay: 1,
    },
    estimatedDuration: 45,
    timeOfDay: ['EARLY_MORNING'],
    instructions: 'Assist client with bathing, grooming, oral care, and dressing. Ensure dignity and privacy.',
    requiresSignature: false,
    requiresNote: false,
    isOptional: false,
    allowSkip: false,
    status: 'ACTIVE',
  },

  {
    name: 'Shower/Bath Assistance',
    description: 'Assist client with bathing',
    category: 'BATHING',
    frequency: {
      pattern: 'WEEKLY',
      timesPerWeek: 3,
    },
    estimatedDuration: 45,
    timeOfDay: ['MORNING'],
    instructions: 'Prepare bath/shower area, assist client with bathing, ensure safety, help with drying and dressing.',
    precautions: ['Check water temperature', 'Use non-slip mat', 'Never leave client unattended'],
    requiresSignature: false,
    requiresNote: false,
    isOptional: false,
    allowSkip: false,
    status: 'ACTIVE',
  },

  // Mobility
  {
    name: 'Ambulation Exercise',
    description: 'Assist client with walking/mobility exercise',
    category: 'AMBULATION',
    frequency: {
      pattern: 'DAILY',
      timesPerDay: 2,
    },
    estimatedDuration: 20,
    timeOfDay: ['MORNING', 'AFTERNOON'],
    instructions: 'Assist client with safe ambulation using appropriate assistive devices. Monitor for fatigue or distress.',
    precautions: ['Ensure proper footwear', 'Use gait belt if needed', 'Clear walking path'],
    requiresSignature: false,
    requiresNote: false,
    isOptional: false,
    allowSkip: true,
    skipReasons: ['Client refused', 'Client too fatigued', 'Medical contraindication'],
    status: 'ACTIVE',
  },

  {
    name: 'Transfer Assistance',
    description: 'Assist client with bed/chair transfers',
    category: 'TRANSFERRING',
    frequency: {
      pattern: 'AS_NEEDED',
    },
    estimatedDuration: 10,
    timeOfDay: ['ANY'],
    instructions: 'Use proper body mechanics and assistive devices. Ensure client safety during all transfers.',
    precautions: ['Lock wheelchair brakes', 'Use transfer belt', 'Get help if needed'],
    requiresSignature: false,
    requiresNote: false,
    isOptional: false,
    allowSkip: false,
    status: 'ACTIVE',
  },

  // Meals
  {
    name: 'Meal Preparation',
    description: 'Prepare nutritious meal according to diet plan',
    category: 'MEAL_PREPARATION',
    frequency: {
      pattern: 'DAILY',
      timesPerDay: 3,
    },
    estimatedDuration: 30,
    timeOfDay: ['MORNING', 'AFTERNOON', 'EVENING'],
    instructions: 'Prepare meal following dietary restrictions and preferences. Ensure food safety and proper portions.',
    requiresSignature: false,
    requiresNote: false,
    isOptional: false,
    allowSkip: false,
    status: 'ACTIVE',
  },

  {
    name: 'Feeding Assistance',
    description: 'Assist client with eating',
    category: 'FEEDING',
    frequency: {
      pattern: 'DAILY',
      timesPerDay: 3,
    },
    estimatedDuration: 30,
    timeOfDay: ['MORNING', 'AFTERNOON', 'EVENING'],
    instructions: 'Assist client with eating at appropriate pace. Monitor for swallowing difficulties. Encourage fluid intake.',
    precautions: ['Ensure proper positioning', 'Check food temperature', 'Watch for choking'],
    requiresSignature: false,
    requiresNote: true,
    isOptional: false,
    allowSkip: false,
    status: 'ACTIVE',
  },

  // Housekeeping
  {
    name: 'Light Housekeeping',
    description: 'Perform light housekeeping duties',
    category: 'HOUSEKEEPING',
    frequency: {
      pattern: 'WEEKLY',
      timesPerWeek: 2,
    },
    estimatedDuration: 60,
    timeOfDay: ['MORNING', 'AFTERNOON'],
    instructions: 'Tidy living areas, clean surfaces, vacuum/sweep floors. Focus on client safety and sanitation.',
    requiresSignature: false,
    requiresNote: false,
    isOptional: true,
    allowSkip: true,
    status: 'ACTIVE',
  },

  {
    name: 'Laundry',
    description: 'Wash, dry, and fold client laundry',
    category: 'LAUNDRY',
    frequency: {
      pattern: 'WEEKLY',
      timesPerWeek: 2,
    },
    estimatedDuration: 45,
    timeOfDay: ['ANY'],
    instructions: 'Sort laundry, wash and dry per care labels, fold and put away. Check for any needed repairs.',
    requiresSignature: false,
    requiresNote: false,
    isOptional: true,
    allowSkip: true,
    status: 'ACTIVE',
  },

  // Social/Companionship
  {
    name: 'Companionship Activity',
    description: 'Engage client in conversation and activities',
    category: 'COMPANIONSHIP',
    frequency: {
      pattern: 'DAILY',
      timesPerDay: 1,
    },
    estimatedDuration: 30,
    timeOfDay: ['AFTERNOON'],
    instructions: 'Engage client in meaningful conversation, games, reading, or other preferred activities. Provide emotional support.',
    requiresSignature: false,
    requiresNote: false,
    isOptional: false,
    allowSkip: false,
    status: 'ACTIVE',
  },

  // Safety
  {
    name: 'Safety Check',
    description: 'Conduct safety assessment of home environment',
    category: 'MONITORING',
    frequency: {
      pattern: 'DAILY',
      timesPerDay: 1,
    },
    estimatedDuration: 15,
    timeOfDay: ['ANY'],
    instructions: 'Check for hazards, ensure emergency contacts visible, verify medical equipment functioning, assess client wellbeing.',
    qualityChecks: [
      {
        id: 'safety-1',
        question: 'Are walkways clear of obstacles?',
        checkType: 'YES_NO',
        required: true,
      },
      {
        id: 'safety-2',
        question: 'Is lighting adequate in all areas?',
        checkType: 'YES_NO',
        required: true,
      },
      {
        id: 'safety-3',
        question: 'Are emergency contacts easily accessible?',
        checkType: 'YES_NO',
        required: true,
      },
    ],
    requiresSignature: false,
    requiresNote: true,
    isOptional: false,
    allowSkip: false,
    status: 'ACTIVE',
  },

  // Documentation
  {
    name: 'Visit Documentation',
    description: 'Complete visit notes and documentation',
    category: 'DOCUMENTATION',
    frequency: {
      pattern: 'DAILY',
      timesPerDay: 1,
    },
    estimatedDuration: 15,
    timeOfDay: ['ANY'],
    instructions: 'Document all care provided, client condition, any changes or concerns, and time spent on each activity.',
    requiresSignature: true,
    requiresNote: true,
    isOptional: false,
    allowSkip: false,
    status: 'ACTIVE',
  },
];

/**
 * Task template categories for filtering
 */
export const TASK_TEMPLATE_CATEGORIES = {
  MEDICATION: 'Medication Management',
  PERSONAL_CARE: 'Personal Care',
  MOBILITY: 'Mobility & Transfers',
  MEALS: 'Meals & Nutrition',
  HOUSEKEEPING: 'Housekeeping',
  SOCIAL: 'Social & Companionship',
  SAFETY: 'Safety & Monitoring',
  DOCUMENTATION: 'Documentation',
} as const;

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: keyof typeof TASK_TEMPLATE_CATEGORIES) => {
  const categoryMap: Record<keyof typeof TASK_TEMPLATE_CATEGORIES, string[]> = {
    MEDICATION: ['MEDICATION'],
    PERSONAL_CARE: ['PERSONAL_HYGIENE', 'BATHING', 'DRESSING', 'GROOMING', 'TOILETING'],
    MOBILITY: ['MOBILITY', 'TRANSFERRING', 'AMBULATION'],
    MEALS: ['MEAL_PREPARATION', 'FEEDING'],
    HOUSEKEEPING: ['HOUSEKEEPING', 'LAUNDRY'],
    SOCIAL: ['COMPANIONSHIP'],
    SAFETY: ['MONITORING'],
    DOCUMENTATION: ['DOCUMENTATION'],
  };

  const categories = categoryMap[category] || [];
  return COMMON_TASK_TEMPLATES.filter(template => categories.includes(template.category));
};

/**
 * Get template by name
 */
export const getTemplateByName = (name: string) => {
  return COMMON_TASK_TEMPLATES.find(template => template.name === name);
};
