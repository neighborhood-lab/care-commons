/**
 * Care Plan Templates
 *
 * Pre-built templates for common care scenarios to speed up care plan creation
 * and ensure consistency in care delivery.
 */

import { TaskCategory, FrequencyPattern } from '../types/care-plan';

/**
 * Simplified template category for coordinators
 */
export type CarePlanTemplateCategory =
  | 'personal_care'
  | 'skilled_nursing'
  | 'companionship'
  | 'memory_care'
  | 'post_hospital';

/**
 * Simplified template task category
 */
export type TemplateTaskCategory =
  | 'medication'
  | 'vital_signs'
  | 'personal_care'
  | 'meal_prep'
  | 'mobility'
  | 'safety_check'
  | 'documentation'
  | 'other';

/**
 * Simplified frequency for templates
 */
export type TemplateFrequency = 'once' | 'daily' | 'weekly' | 'as_needed';

/**
 * Simplified priority for templates
 */
export type TemplatePriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Task template for care plan templates
 */
export interface TaskTemplate {
  description: string;
  category: TemplateTaskCategory;
  frequency: TemplateFrequency;
  scheduled_time?: string;
  priority: TemplatePriority;
  estimated_duration_minutes: number;
  instructions?: string;
}

/**
 * Care plan template definition
 */
export interface CarePlanTemplate {
  id: string;
  name: string;
  description: string;
  category: CarePlanTemplateCategory;
  typical_duration_days: number;
  goals: string;
  tasks: TaskTemplate[];
}

/**
 * Map template task category to actual TaskCategory
 */
export function mapTaskCategory(templateCategory: TemplateTaskCategory): TaskCategory {
  const mapping: Record<TemplateTaskCategory, TaskCategory> = {
    medication: 'MEDICATION',
    vital_signs: 'MONITORING',
    personal_care: 'BATHING',
    meal_prep: 'MEAL_PREPARATION',
    mobility: 'MOBILITY',
    safety_check: 'MONITORING',
    documentation: 'DOCUMENTATION',
    other: 'OTHER',
  };
  return mapping[templateCategory];
}

/**
 * Map template frequency to actual FrequencyPattern
 */
export function mapFrequency(templateFrequency: TemplateFrequency): FrequencyPattern {
  const mapping: Record<TemplateFrequency, FrequencyPattern> = {
    once: 'CUSTOM',
    daily: 'DAILY',
    weekly: 'WEEKLY',
    as_needed: 'AS_NEEDED',
  };
  return mapping[templateFrequency];
}

/**
 * Pre-defined care plan templates
 */
export const CARE_PLAN_TEMPLATES: CarePlanTemplate[] = [
  {
    id: 'personal-care-standard',
    name: 'Standard Personal Care',
    description: 'General personal care assistance for clients needing help with ADLs',
    category: 'personal_care',
    typical_duration_days: 90,
    goals: 'Maintain client independence and dignity while providing assistance with activities of daily living (ADLs). Ensure client safety, hygiene, and comfort.',
    tasks: [
      {
        description: 'Assist with bathing and personal hygiene',
        category: 'personal_care',
        frequency: 'daily',
        scheduled_time: '09:00',
        priority: 'high',
        estimated_duration_minutes: 45,
        instructions: 'Ensure water temperature is safe. Use non-slip mat. Assist as needed while maintaining client dignity.',
      },
      {
        description: 'Assist with dressing',
        category: 'personal_care',
        frequency: 'daily',
        scheduled_time: '09:45',
        priority: 'medium',
        estimated_duration_minutes: 20,
        instructions: 'Allow client to choose clothing. Assist as needed. Check for skin irritation or pressure sores.',
      },
      {
        description: 'Prepare and assist with meals',
        category: 'meal_prep',
        frequency: 'daily',
        scheduled_time: '12:00',
        priority: 'high',
        estimated_duration_minutes: 60,
        instructions: 'Follow dietary restrictions. Ensure adequate hydration. Note any changes in appetite.',
      },
      {
        description: 'Light housekeeping',
        category: 'other',
        frequency: 'daily',
        priority: 'low',
        estimated_duration_minutes: 30,
        instructions: 'Maintain clean and safe environment. Focus on high-traffic areas.',
      },
      {
        description: 'Medication reminder',
        category: 'medication',
        frequency: 'daily',
        scheduled_time: '08:00',
        priority: 'critical',
        estimated_duration_minutes: 10,
        instructions: 'Verify medications against list. Observe client taking medication. Document.',
      },
      {
        description: 'Safety check',
        category: 'safety_check',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 10,
        instructions: 'Check for hazards. Ensure emergency devices are working. Verify contact information is current.',
      },
    ],
  },

  {
    id: 'post-hospital-recovery',
    name: 'Post-Hospital Recovery',
    description: 'Intensive care for clients recovering from hospital stay',
    category: 'post_hospital',
    typical_duration_days: 30,
    goals: 'Support safe transition from hospital to home. Monitor recovery progress. Prevent hospital readmission. Restore independence gradually.',
    tasks: [
      {
        description: 'Check vital signs (BP, pulse, temperature)',
        category: 'vital_signs',
        frequency: 'daily',
        scheduled_time: '09:00',
        priority: 'critical',
        estimated_duration_minutes: 15,
        instructions: 'Record all vitals. Report abnormal readings immediately. Know client baseline values.',
      },
      {
        description: 'Medication administration per doctor orders',
        category: 'medication',
        frequency: 'daily',
        priority: 'critical',
        estimated_duration_minutes: 20,
        instructions: 'Follow hospital discharge instructions exactly. Watch for side effects. Document administration.',
      },
      {
        description: 'Wound care and dressing changes',
        category: 'other',
        frequency: 'daily',
        priority: 'critical',
        estimated_duration_minutes: 30,
        instructions: 'Follow sterile technique. Check for signs of infection. Document wound appearance.',
      },
      {
        description: 'Assist with prescribed exercises',
        category: 'mobility',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 30,
        instructions: 'Follow physical therapy plan. Do not overexert client. Report pain or difficulty.',
      },
      {
        description: 'Monitor food and fluid intake',
        category: 'meal_prep',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 15,
        instructions: 'Document intake. Watch for appetite changes. Ensure adequate hydration.',
      },
      {
        description: 'Communication with family and care team',
        category: 'documentation',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 20,
        instructions: 'Update family on progress. Report concerns to coordinator. Document all communications.',
      },
    ],
  },

  {
    id: 'memory-care-dementia',
    name: "Memory Care (Dementia/Alzheimer's)",
    description: 'Specialized care for clients with cognitive impairment',
    category: 'memory_care',
    typical_duration_days: 180,
    goals: 'Provide safe, structured environment. Maintain cognitive function. Reduce anxiety and confusion. Support caregiver family members.',
    tasks: [
      {
        description: 'Establish daily routine',
        category: 'other',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 20,
        instructions: 'Maintain consistent schedule. Use visual cues. Reduce changes and surprises.',
      },
      {
        description: 'Cognitive stimulation activities',
        category: 'other',
        frequency: 'daily',
        scheduled_time: '14:00',
        priority: 'medium',
        estimated_duration_minutes: 60,
        instructions: 'Use memory games, music, reminiscence therapy. Adapt to client ability level.',
      },
      {
        description: 'Safety monitoring',
        category: 'safety_check',
        frequency: 'daily',
        priority: 'critical',
        estimated_duration_minutes: 30,
        instructions: 'Prevent wandering. Remove hazards. Monitor for agitation or sundowning.',
      },
      {
        description: 'Personal care with reassurance',
        category: 'personal_care',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 60,
        instructions: 'Use calm, simple language. Allow extra time. Maintain dignity and respect.',
      },
      {
        description: 'Medication management',
        category: 'medication',
        frequency: 'daily',
        priority: 'critical',
        estimated_duration_minutes: 15,
        instructions: 'Supervise all medications. Watch for side effects. Report behavioral changes.',
      },
      {
        description: 'Document behavior and mood changes',
        category: 'documentation',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 15,
        instructions: 'Note triggers for agitation. Track sleep patterns. Document appetite and hydration.',
      },
    ],
  },

  {
    id: 'companionship-light-care',
    name: 'Companionship & Light Care',
    description: 'Social engagement and light assistance for relatively independent clients',
    category: 'companionship',
    typical_duration_days: 120,
    goals: 'Reduce social isolation. Provide mental stimulation. Assist with light household tasks. Monitor general wellbeing.',
    tasks: [
      {
        description: 'Social engagement and conversation',
        category: 'other',
        frequency: 'daily',
        priority: 'medium',
        estimated_duration_minutes: 90,
        instructions: 'Engage in meaningful conversation. Discuss interests, memories, current events.',
      },
      {
        description: 'Assist with errands and shopping',
        category: 'other',
        frequency: 'weekly',
        priority: 'medium',
        estimated_duration_minutes: 120,
        instructions: 'Help with grocery shopping, pharmacy pickups, appointments.',
      },
      {
        description: 'Light meal preparation',
        category: 'meal_prep',
        frequency: 'daily',
        priority: 'medium',
        estimated_duration_minutes: 45,
        instructions: 'Prepare simple, nutritious meals. Follow any dietary restrictions.',
      },
      {
        description: 'Recreation and activities',
        category: 'other',
        frequency: 'daily',
        priority: 'medium',
        estimated_duration_minutes: 60,
        instructions: 'Games, puzzles, crafts, walks, gardening based on client interests.',
      },
      {
        description: 'Medication reminder',
        category: 'medication',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 10,
        instructions: 'Remind client to take medications. Client self-administers.',
      },
    ],
  },

  {
    id: 'skilled-nursing-diabetes',
    name: 'Skilled Nursing - Diabetes Management',
    description: 'Specialized care for clients requiring diabetes management',
    category: 'skilled_nursing',
    typical_duration_days: 90,
    goals: 'Maintain blood sugar control. Prevent complications. Educate client on self-management. Monitor for emergency situations.',
    tasks: [
      {
        description: 'Blood glucose monitoring',
        category: 'vital_signs',
        frequency: 'daily',
        scheduled_time: '08:00',
        priority: 'critical',
        estimated_duration_minutes: 10,
        instructions: 'Test before meals and at bedtime. Record all readings. Know client target range.',
      },
      {
        description: 'Insulin administration',
        category: 'medication',
        frequency: 'daily',
        priority: 'critical',
        estimated_duration_minutes: 15,
        instructions: 'Follow doctor orders precisely. Rotate injection sites. Monitor for reactions.',
      },
      {
        description: 'Foot care and inspection',
        category: 'personal_care',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 20,
        instructions: 'Check for cuts, blisters, redness. Keep feet clean and dry. Report any concerns.',
      },
      {
        description: 'Meal planning and monitoring',
        category: 'meal_prep',
        frequency: 'daily',
        priority: 'critical',
        estimated_duration_minutes: 60,
        instructions: 'Follow diabetic diet plan. Count carbohydrates. Ensure consistent meal times.',
      },
      {
        description: 'Education on diabetes management',
        category: 'documentation',
        frequency: 'weekly',
        priority: 'high',
        estimated_duration_minutes: 30,
        instructions: 'Teach about diet, exercise, medication. Empower client for self-care.',
      },
      {
        description: 'Monitor for hypo/hyperglycemia',
        category: 'safety_check',
        frequency: 'daily',
        priority: 'critical',
        estimated_duration_minutes: 15,
        instructions: 'Know symptoms. Have glucose tablets available. Know emergency protocol.',
      },
    ],
  },
];

/**
 * Get all care plan templates
 */
export function getAllTemplates(): CarePlanTemplate[] {
  return CARE_PLAN_TEMPLATES;
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): CarePlanTemplate | undefined {
  return CARE_PLAN_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: CarePlanTemplateCategory): CarePlanTemplate[] {
  return CARE_PLAN_TEMPLATES.filter((t) => t.category === category);
}
