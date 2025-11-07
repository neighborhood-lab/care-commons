import type { TaskTemplate } from '../types';

/**
 * Common task templates to speed up care plan creation
 *
 * Note: These templates use the simplified frontend TaskTemplate interface.
 * Additional details like frequency, duration, steps, and precautions should be
 * added when creating actual TaskInstances from these templates.
 */

export const COMMON_TASK_TEMPLATES: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Medication Management
  {
    name: 'Morning Medications',
    description: 'Administer morning medications per schedule',
    category: 'MEDICATION',
    instructions: 'Review medication list, verify correct dosages, administer with food/water as required, document administration.\n\nSteps:\n1. Review medication list and verify client identity\n2. Check medication labels and expiration dates\n3. Administer medications with appropriate food/water\n4. Document administration and observe for reactions',
    requiresSignature: true,
    requiresNote: true,
    isOptional: false,
    status: 'ACTIVE',
  },

  // Vital Signs
  {
    name: 'Daily Vital Signs Check',
    description: 'Check and record vital signs (BP, pulse, temperature)',
    category: 'MONITORING',
    instructions: 'Measure blood pressure, pulse rate, and temperature. Record all readings and note any abnormalities.',
    requiresSignature: false,
    requiresNote: true,
    isOptional: false,
    status: 'ACTIVE',
  },

  // Personal Care
  {
    name: 'Morning Personal Care',
    description: 'Assist with morning personal hygiene routine',
    category: 'PERSONAL_HYGIENE',
    instructions: 'Assist client with bathing, grooming, oral care, and dressing. Ensure dignity and privacy.',
    requiresSignature: false,
    requiresNote: false,
    isOptional: false,
    status: 'ACTIVE',
  },

  {
    name: 'Shower/Bath Assistance',
    description: 'Assist client with bathing',
    category: 'BATHING',
    instructions: 'Prepare bath/shower area, assist client with bathing, ensure safety, help with drying and dressing.\n\nPrecautions:\n- Check water temperature\n- Use non-slip mat\n- Never leave client unattended',
    requiresSignature: false,
    requiresNote: false,
    isOptional: false,
    status: 'ACTIVE',
  },

  // Mobility
  {
    name: 'Ambulation Exercise',
    description: 'Assist client with walking/mobility exercise',
    category: 'AMBULATION',
    instructions: 'Assist client with safe ambulation using appropriate assistive devices. Monitor for fatigue or distress.\n\nPrecautions:\n- Ensure proper footwear\n- Use gait belt if needed\n- Clear walking path',
    requiresSignature: false,
    requiresNote: false,
    isOptional: false,
    status: 'ACTIVE',
  },

  {
    name: 'Transfer Assistance',
    description: 'Assist client with bed/chair transfers',
    category: 'TRANSFERRING',
    instructions: 'Use proper body mechanics and assistive devices. Ensure client safety during all transfers.\n\nPrecautions:\n- Lock wheelchair brakes\n- Use transfer belt\n- Get help if needed',
    requiresSignature: false,
    requiresNote: false,
    isOptional: false,
    status: 'ACTIVE',
  },

  // Meals
  {
    name: 'Meal Preparation',
    description: 'Prepare nutritious meal according to diet plan',
    category: 'MEAL_PREPARATION',
    instructions: 'Prepare meal following dietary restrictions and preferences. Ensure food safety and proper portions.',
    requiresSignature: false,
    requiresNote: false,
    isOptional: false,
    status: 'ACTIVE',
  },

  {
    name: 'Feeding Assistance',
    description: 'Assist client with eating',
    category: 'FEEDING',
    instructions: 'Assist client with eating at appropriate pace. Monitor for swallowing difficulties. Encourage fluid intake.\n\nPrecautions:\n- Ensure proper positioning\n- Check food temperature\n- Watch for choking',
    requiresSignature: false,
    requiresNote: true,
    isOptional: false,
    status: 'ACTIVE',
  },

  // Housekeeping
  {
    name: 'Light Housekeeping',
    description: 'Perform light housekeeping duties',
    category: 'HOUSEKEEPING',
    instructions: 'Tidy living areas, clean surfaces, vacuum/sweep floors. Focus on client safety and sanitation.',
    requiresSignature: false,
    requiresNote: false,
    isOptional: true,
    status: 'ACTIVE',
  },

  {
    name: 'Laundry',
    description: 'Wash, dry, and fold client laundry',
    category: 'LAUNDRY',
    instructions: 'Sort laundry, wash and dry per care labels, fold and put away. Check for any needed repairs.',
    requiresSignature: false,
    requiresNote: false,
    isOptional: true,
    status: 'ACTIVE',
  },

  // Social/Companionship
  {
    name: 'Companionship Activity',
    description: 'Engage client in conversation and activities',
    category: 'COMPANIONSHIP',
    instructions: 'Engage client in meaningful conversation, games, reading, or other preferred activities. Provide emotional support.',
    requiresSignature: false,
    requiresNote: false,
    isOptional: false,
    status: 'ACTIVE',
  },

  // Safety
  {
    name: 'Safety Check',
    description: 'Conduct safety assessment of home environment',
    category: 'MONITORING',
    instructions: 'Check for hazards, ensure emergency contacts visible, verify medical equipment functioning, assess client wellbeing.\n\nQuality Checks:\n- Are walkways clear of obstacles?\n- Is lighting adequate in all areas?\n- Are emergency contacts easily accessible?',
    requiresSignature: false,
    requiresNote: true,
    isOptional: false,
    status: 'ACTIVE',
  },

  // Documentation
  {
    name: 'Visit Documentation',
    description: 'Complete visit notes and documentation',
    category: 'DOCUMENTATION',
    instructions: 'Document all care provided, client condition, any changes or concerns, and time spent on each activity.',
    requiresSignature: true,
    requiresNote: true,
    isOptional: false,
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
