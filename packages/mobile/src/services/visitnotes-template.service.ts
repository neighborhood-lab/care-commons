/**
 * Visit Notes Template Service
 *
 * Manages pre-defined and custom templates for visit documentation.
 * Features:
 * - Pre-defined templates by service type
 * - Custom template creation and management
 * - Auto-fill from care plan data
 * - Template variables for customization
 * - Offline-first with AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_TEMPLATES_KEY = '@folkcare_visit_note_templates';

export type TemplateCategory =
  | 'personal_care'
  | 'medication'
  | 'meal_prep'
  | 'companionship'
  | 'transportation'
  | 'housekeeping'
  | 'vital_signs'
  | 'mobility'
  | 'general'
  | 'custom';

export interface TemplateVariable {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'number' | 'time' | 'select';
  options?: string[]; // For select type
  defaultValue?: string;
}

export interface VisitNoteTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  text: string;
  variables: TemplateVariable[];
  isSystemTemplate: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CarePlanData {
  clientName: string;
  diagnosis?: string[];
  medications?: string[];
  allergies?: string[];
  specialInstructions?: string;
  mobilityLevel?: string;
  dietRestrictions?: string[];
  emergencyContact?: string;
}

/**
 * System-defined templates for common service types
 */
const SYSTEM_TEMPLATES: Omit<VisitNoteTemplate, 'createdAt' | 'updatedAt'>[] = [
  // Personal Care Templates
  {
    id: 'sys_personal_care_1',
    name: 'Personal Care - Complete',
    category: 'personal_care',
    text: 'Assisted client with personal care including [ACTIVITIES]. Client tolerated all activities [TOLERANCE]. Skin condition: [SKIN_CONDITION]. [ADDITIONAL_NOTES]',
    variables: [
      {
        key: 'ACTIVITIES',
        label: 'Activities',
        placeholder: 'bathing, dressing, grooming',
        type: 'text',
        defaultValue: 'bathing, dressing, and grooming',
      },
      {
        key: 'TOLERANCE',
        label: 'Tolerance Level',
        placeholder: 'Select tolerance',
        type: 'select',
        options: ['well', 'with minimal assistance', 'with moderate assistance', 'with maximum assistance'],
        defaultValue: 'well',
      },
      {
        key: 'SKIN_CONDITION',
        label: 'Skin Condition',
        placeholder: 'Describe skin condition',
        type: 'select',
        options: ['Intact, no concerns', 'Dry skin noted', 'Redness observed - documented', 'Bruising noted - reported to supervisor'],
        defaultValue: 'Intact, no concerns',
      },
      {
        key: 'ADDITIONAL_NOTES',
        label: 'Additional Notes',
        placeholder: 'Any additional observations',
        type: 'text',
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },
  {
    id: 'sys_personal_care_2',
    name: 'Personal Care - Bathing',
    category: 'personal_care',
    text: 'Provided [BATH_TYPE] assistance. Water temperature verified safe. Used [EQUIPMENT] for safety. Client was [CLIENT_STATE] during bath. Skin inspected - [SKIN_NOTES].',
    variables: [
      {
        key: 'BATH_TYPE',
        label: 'Bath Type',
        placeholder: 'Select bath type',
        type: 'select',
        options: ['shower', 'bed bath', 'sponge bath', 'tub bath'],
        defaultValue: 'shower',
      },
      {
        key: 'EQUIPMENT',
        label: 'Safety Equipment',
        placeholder: 'Select equipment used',
        type: 'select',
        options: ['shower chair', 'grab bars', 'gait belt', 'shower chair and grab bars'],
        defaultValue: 'shower chair',
      },
      {
        key: 'CLIENT_STATE',
        label: 'Client State',
        placeholder: 'How was the client?',
        type: 'select',
        options: ['cooperative and comfortable', 'anxious but cooperative', 'resistant - used calming techniques', 'refused - documented and reported'],
      },
      {
        key: 'SKIN_NOTES',
        label: 'Skin Notes',
        placeholder: 'Skin condition observations',
        type: 'text',
        defaultValue: 'no abnormalities noted',
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },

  // Medication Templates
  {
    id: 'sys_medication_1',
    name: 'Medication Reminder',
    category: 'medication',
    text: 'Reminded client to take prescribed medications at [TIME]. Client took [MED_COUNT] medication(s): [MEDICATIONS]. Client [SELF_ADMIN]. No adverse reactions observed.',
    variables: [
      {
        key: 'TIME',
        label: 'Time',
        placeholder: 'Time medication was taken',
        type: 'time',
      },
      {
        key: 'MED_COUNT',
        label: 'Number of Medications',
        placeholder: 'How many medications',
        type: 'number',
      },
      {
        key: 'MEDICATIONS',
        label: 'Medications',
        placeholder: 'List medications if known',
        type: 'text',
        defaultValue: 'as prescribed by physician',
      },
      {
        key: 'SELF_ADMIN',
        label: 'Self-Administration',
        placeholder: 'Did client self-administer?',
        type: 'select',
        options: ['self-administered medications', 'required verbal prompting', 'required physical assistance with opening containers'],
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },
  {
    id: 'sys_medication_2',
    name: 'Medication Refusal',
    category: 'medication',
    text: 'IMPORTANT: Client refused [MEDICATION] at [TIME]. Reason given: [REASON]. Supervisor notified at [NOTIFY_TIME]. Will attempt again [FOLLOWUP].',
    variables: [
      {
        key: 'MEDICATION',
        label: 'Medication Refused',
        placeholder: 'Which medication',
        type: 'text',
      },
      {
        key: 'TIME',
        label: 'Time of Refusal',
        placeholder: 'When did client refuse',
        type: 'time',
      },
      {
        key: 'REASON',
        label: 'Reason Given',
        placeholder: 'Why did client refuse',
        type: 'text',
        defaultValue: 'no reason given',
      },
      {
        key: 'NOTIFY_TIME',
        label: 'Notification Time',
        placeholder: 'When was supervisor notified',
        type: 'time',
      },
      {
        key: 'FOLLOWUP',
        label: 'Follow-up Plan',
        placeholder: 'Next steps',
        type: 'select',
        options: ['per care plan instructions', 'at next scheduled time', 'per supervisor instructions'],
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },

  // Meal Preparation Templates
  {
    id: 'sys_meal_prep_1',
    name: 'Meal Preparation - Standard',
    category: 'meal_prep',
    text: 'Prepared [MEAL_TYPE] for client. Menu: [MENU]. Followed [DIET] dietary requirements. Client ate [AMOUNT] of meal. Fluids: [FLUIDS].',
    variables: [
      {
        key: 'MEAL_TYPE',
        label: 'Meal Type',
        placeholder: 'Select meal type',
        type: 'select',
        options: ['breakfast', 'lunch', 'dinner', 'snack'],
      },
      {
        key: 'MENU',
        label: 'Menu Items',
        placeholder: 'What was prepared',
        type: 'text',
      },
      {
        key: 'DIET',
        label: 'Dietary Requirements',
        placeholder: 'Select diet type',
        type: 'select',
        options: ['regular', 'diabetic', 'low sodium', 'pureed', 'mechanical soft', 'liquid', 'renal'],
        defaultValue: 'regular',
      },
      {
        key: 'AMOUNT',
        label: 'Amount Eaten',
        placeholder: 'How much did client eat',
        type: 'select',
        options: ['100%', '75%', '50%', '25%', 'less than 25%', 'refused meal'],
      },
      {
        key: 'FLUIDS',
        label: 'Fluid Intake',
        placeholder: 'Fluid intake details',
        type: 'text',
        defaultValue: 'adequate fluids consumed',
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },
  {
    id: 'sys_meal_prep_2',
    name: 'Feeding Assistance',
    category: 'meal_prep',
    text: 'Provided feeding assistance for [MEAL_TYPE]. Client required [ASSISTANCE_LEVEL]. Positioned client [POSITION]. No signs of choking or aspiration. [ADDITIONAL]',
    variables: [
      {
        key: 'MEAL_TYPE',
        label: 'Meal',
        placeholder: 'Which meal',
        type: 'select',
        options: ['breakfast', 'lunch', 'dinner', 'snack'],
      },
      {
        key: 'ASSISTANCE_LEVEL',
        label: 'Assistance Level',
        placeholder: 'Level of help needed',
        type: 'select',
        options: ['verbal cueing only', 'hand-over-hand assistance', 'full feeding assistance'],
      },
      {
        key: 'POSITION',
        label: 'Positioning',
        placeholder: 'How was client positioned',
        type: 'select',
        options: ['upright in chair', 'upright in bed at 90 degrees', 'upright in wheelchair'],
      },
      {
        key: 'ADDITIONAL',
        label: 'Additional Notes',
        placeholder: 'Any other observations',
        type: 'text',
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },

  // Companionship Templates
  {
    id: 'sys_companionship_1',
    name: 'Companionship Visit',
    category: 'companionship',
    text: 'Spent quality time with client. Activities included: [ACTIVITIES]. Client mood: [MOOD]. Conversation topics: [TOPICS]. Client appeared [ENGAGEMENT] during visit.',
    variables: [
      {
        key: 'ACTIVITIES',
        label: 'Activities',
        placeholder: 'What activities did you do',
        type: 'text',
        defaultValue: 'conversation, reading, games',
      },
      {
        key: 'MOOD',
        label: 'Client Mood',
        placeholder: 'How was client feeling',
        type: 'select',
        options: ['happy and engaged', 'content', 'neutral', 'sad/withdrawn', 'anxious', 'agitated'],
      },
      {
        key: 'TOPICS',
        label: 'Conversation Topics',
        placeholder: 'What did you talk about',
        type: 'text',
      },
      {
        key: 'ENGAGEMENT',
        label: 'Engagement Level',
        placeholder: 'How engaged was client',
        type: 'select',
        options: ['very engaged and participatory', 'moderately engaged', 'minimally engaged', 'mostly non-responsive'],
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },
  {
    id: 'sys_companionship_2',
    name: 'Social Activity',
    category: 'companionship',
    text: 'Accompanied client to [ACTIVITY]. Duration: [DURATION]. Client interaction with others: [INTERACTION]. Overall experience: [EXPERIENCE].',
    variables: [
      {
        key: 'ACTIVITY',
        label: 'Activity',
        placeholder: 'What social activity',
        type: 'text',
      },
      {
        key: 'DURATION',
        label: 'Duration',
        placeholder: 'How long',
        type: 'text',
      },
      {
        key: 'INTERACTION',
        label: 'Social Interaction',
        placeholder: 'How did client interact',
        type: 'select',
        options: ['positive, engaged with others', 'somewhat reserved but participated', 'preferred to observe', 'did not interact with others'],
      },
      {
        key: 'EXPERIENCE',
        label: 'Overall Experience',
        placeholder: 'How was the experience',
        type: 'select',
        options: ['very positive', 'positive', 'neutral', 'challenging but completed'],
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },

  // Transportation Templates
  {
    id: 'sys_transportation_1',
    name: 'Medical Appointment Transport',
    category: 'transportation',
    text: 'Transported client to [DESTINATION] for [APPOINTMENT_TYPE]. Departure: [DEPART_TIME], Arrival: [ARRIVE_TIME]. Used [MOBILITY_AID] for transfers. Client tolerated transport [TOLERANCE].',
    variables: [
      {
        key: 'DESTINATION',
        label: 'Destination',
        placeholder: 'Where did you go',
        type: 'text',
      },
      {
        key: 'APPOINTMENT_TYPE',
        label: 'Appointment Type',
        placeholder: 'Type of appointment',
        type: 'select',
        options: ['doctor visit', 'specialist appointment', 'lab work', 'therapy session', 'dialysis', 'other medical'],
      },
      {
        key: 'DEPART_TIME',
        label: 'Departure Time',
        placeholder: 'When did you leave',
        type: 'time',
      },
      {
        key: 'ARRIVE_TIME',
        label: 'Arrival Time',
        placeholder: 'When did you arrive',
        type: 'time',
      },
      {
        key: 'MOBILITY_AID',
        label: 'Mobility Aid',
        placeholder: 'What mobility aid was used',
        type: 'select',
        options: ['none needed', 'cane', 'walker', 'wheelchair', 'gait belt only'],
        defaultValue: 'none needed',
      },
      {
        key: 'TOLERANCE',
        label: 'Transport Tolerance',
        placeholder: 'How did client tolerate',
        type: 'select',
        options: ['well, no issues', 'with some fatigue', 'with difficulty - documented'],
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },
  {
    id: 'sys_transportation_2',
    name: 'Errand/Shopping Trip',
    category: 'transportation',
    text: 'Accompanied client for [ERRAND_TYPE]. Locations visited: [LOCATIONS]. Total time out: [DURATION]. Client energy level: [ENERGY]. [NOTES]',
    variables: [
      {
        key: 'ERRAND_TYPE',
        label: 'Errand Type',
        placeholder: 'What type of errand',
        type: 'select',
        options: ['grocery shopping', 'pharmacy pickup', 'banking', 'personal shopping', 'multiple errands'],
      },
      {
        key: 'LOCATIONS',
        label: 'Locations',
        placeholder: 'Where did you go',
        type: 'text',
      },
      {
        key: 'DURATION',
        label: 'Duration',
        placeholder: 'How long were you out',
        type: 'text',
      },
      {
        key: 'ENERGY',
        label: 'Client Energy',
        placeholder: 'How was client energy',
        type: 'select',
        options: ['good throughout', 'adequate', 'tired toward end', 'needed rest breaks'],
      },
      {
        key: 'NOTES',
        label: 'Additional Notes',
        placeholder: 'Any other observations',
        type: 'text',
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },

  // Light Housekeeping Templates
  {
    id: 'sys_housekeeping_1',
    name: 'Light Housekeeping - General',
    category: 'housekeeping',
    text: 'Completed light housekeeping tasks: [TASKS]. Areas cleaned: [AREAS]. Used client-approved cleaning products. Home environment now [CONDITION].',
    variables: [
      {
        key: 'TASKS',
        label: 'Tasks Completed',
        placeholder: 'What tasks were done',
        type: 'text',
        defaultValue: 'dusting, vacuuming, dishes, laundry',
      },
      {
        key: 'AREAS',
        label: 'Areas Cleaned',
        placeholder: 'Which rooms/areas',
        type: 'text',
        defaultValue: 'kitchen, living room, bedroom, bathroom',
      },
      {
        key: 'CONDITION',
        label: 'Home Condition',
        placeholder: 'Current condition',
        type: 'select',
        options: ['clean and organized', 'tidy and safe', 'improved but more work needed next visit'],
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },
  {
    id: 'sys_housekeeping_2',
    name: 'Laundry Service',
    category: 'housekeeping',
    text: 'Completed laundry for client. [LOADS] load(s) washed and dried. Items included: [ITEMS]. Clothes folded/hung and put away in [LOCATION].',
    variables: [
      {
        key: 'LOADS',
        label: 'Number of Loads',
        placeholder: 'How many loads',
        type: 'number',
        defaultValue: '1',
      },
      {
        key: 'ITEMS',
        label: 'Items Washed',
        placeholder: 'What was washed',
        type: 'text',
        defaultValue: 'clothes, towels, linens',
      },
      {
        key: 'LOCATION',
        label: 'Put Away Location',
        placeholder: 'Where were items stored',
        type: 'text',
        defaultValue: 'bedroom closet and drawers',
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },

  // Vital Signs Templates
  {
    id: 'sys_vital_signs_1',
    name: 'Vital Signs Check',
    category: 'vital_signs',
    text: 'Vital signs recorded: Blood Pressure: [BP], Pulse: [PULSE] bpm, Temperature: [TEMP], Oxygen Saturation: [O2_SAT]%. [COMPARISON] Client reported feeling [CLIENT_FEELING].',
    variables: [
      {
        key: 'BP',
        label: 'Blood Pressure',
        placeholder: 'e.g., 120/80',
        type: 'text',
      },
      {
        key: 'PULSE',
        label: 'Pulse',
        placeholder: 'beats per minute',
        type: 'number',
      },
      {
        key: 'TEMP',
        label: 'Temperature',
        placeholder: 'e.g., 98.6F',
        type: 'text',
      },
      {
        key: 'O2_SAT',
        label: 'Oxygen Saturation',
        placeholder: 'percentage',
        type: 'number',
      },
      {
        key: 'COMPARISON',
        label: 'Comparison to Normal',
        placeholder: 'How do readings compare',
        type: 'select',
        options: ['All readings within normal range.', 'Readings slightly elevated - will monitor.', 'Readings concerning - supervisor notified.'],
      },
      {
        key: 'CLIENT_FEELING',
        label: 'Client Feeling',
        placeholder: 'How client reported feeling',
        type: 'select',
        options: ['well', 'tired', 'unwell', 'no complaints'],
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },

  // Mobility Templates
  {
    id: 'sys_mobility_1',
    name: 'Mobility Assistance',
    category: 'mobility',
    text: 'Provided mobility assistance for [ACTIVITY]. Used [EQUIPMENT] for safety. Client required [ASSISTANCE_LEVEL]. Gait was [GAIT_QUALITY]. No falls or near-falls during visit.',
    variables: [
      {
        key: 'ACTIVITY',
        label: 'Activity',
        placeholder: 'What mobility activity',
        type: 'select',
        options: ['transfers', 'ambulation', 'exercises', 'bed mobility', 'all activities'],
      },
      {
        key: 'EQUIPMENT',
        label: 'Equipment Used',
        placeholder: 'What equipment',
        type: 'select',
        options: ['gait belt', 'walker', 'cane', 'wheelchair', 'gait belt and walker', 'no equipment needed'],
      },
      {
        key: 'ASSISTANCE_LEVEL',
        label: 'Assistance Level',
        placeholder: 'How much help needed',
        type: 'select',
        options: ['standby assistance only', 'minimal assistance', 'moderate assistance', 'maximum assistance', 'two-person assist'],
      },
      {
        key: 'GAIT_QUALITY',
        label: 'Gait Quality',
        placeholder: 'How was their walking',
        type: 'select',
        options: ['steady and safe', 'slightly unsteady', 'unsteady - close supervision needed', 'unable to ambulate safely'],
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },

  // General Templates
  {
    id: 'sys_general_1',
    name: 'General Visit Summary',
    category: 'general',
    text: 'Visit completed as scheduled. Client was [MOOD] and [COOPERATION]. Activities completed: [ACTIVITIES]. No concerns to report. Next visit: [NEXT_VISIT].',
    variables: [
      {
        key: 'MOOD',
        label: 'Client Mood',
        placeholder: 'How was client mood',
        type: 'select',
        options: ['in good spirits', 'pleasant', 'quiet', 'not feeling well'],
      },
      {
        key: 'COOPERATION',
        label: 'Cooperation Level',
        placeholder: 'How cooperative was client',
        type: 'select',
        options: ['cooperative', 'somewhat cooperative', 'needed encouragement', 'declined some activities'],
      },
      {
        key: 'ACTIVITIES',
        label: 'Activities Completed',
        placeholder: 'What was done during visit',
        type: 'text',
      },
      {
        key: 'NEXT_VISIT',
        label: 'Next Visit',
        placeholder: 'When is next visit',
        type: 'text',
        defaultValue: 'per schedule',
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },
  {
    id: 'sys_general_2',
    name: 'Client in Good Condition',
    category: 'general',
    text: 'Client appeared [CONDITION] today. Vital signs stable. No new concerns reported. Completed all scheduled services without issues. Client is [INDEPENDENT] with most activities.',
    variables: [
      {
        key: 'CONDITION',
        label: 'Overall Condition',
        placeholder: 'Client condition',
        type: 'select',
        options: ['healthy and alert', 'comfortable', 'stable', 'slightly fatigued'],
      },
      {
        key: 'INDEPENDENT',
        label: 'Independence Level',
        placeholder: 'How independent is client',
        type: 'select',
        options: ['independent', 'mostly independent', 'needing moderate assistance', 'requiring significant assistance'],
      },
    ],
    isSystemTemplate: true,
    isActive: true,
  },
];

export class VisitNotesTemplateService {
  /**
   * Get all templates (system + custom)
   */
  async getAllTemplates(): Promise<VisitNoteTemplate[]> {
    const systemTemplates = this.getSystemTemplates();
    const customTemplates = await this.getCustomTemplates();
    return [...systemTemplates, ...customTemplates];
  }

  /**
   * Get system templates with timestamps
   */
  getSystemTemplates(): VisitNoteTemplate[] {
    const now = new Date().toISOString();
    return SYSTEM_TEMPLATES.map((t) => ({
      ...t,
      createdAt: now,
      updatedAt: now,
    }));
  }

  /**
   * Get custom templates from storage
   */
  async getCustomTemplates(): Promise<VisitNoteTemplate[]> {
    const stored = await AsyncStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: TemplateCategory): Promise<VisitNoteTemplate[]> {
    const all = await this.getAllTemplates();
    return all.filter((t) => t.category === category && t.isActive);
  }

  /**
   * Save a new custom template
   */
  async saveCustomTemplate(
    name: string,
    category: TemplateCategory,
    text: string,
    variables: TemplateVariable[] = []
  ): Promise<VisitNoteTemplate> {
    const customTemplates = await this.getCustomTemplates();

    const now = new Date().toISOString();
    const newTemplate: VisitNoteTemplate = {
      id: `custom_${Date.now()}`,
      name,
      category,
      text,
      variables,
      isSystemTemplate: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    customTemplates.push(newTemplate);
    await AsyncStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customTemplates));

    return newTemplate;
  }

  /**
   * Update a custom template
   */
  async updateCustomTemplate(
    templateId: string,
    updates: Partial<Pick<VisitNoteTemplate, 'name' | 'text' | 'variables' | 'isActive'>>
  ): Promise<boolean> {
    const customTemplates = await this.getCustomTemplates();
    const index = customTemplates.findIndex((t) => t.id === templateId);

    if (index === -1) return false;

    customTemplates[index] = {
      ...customTemplates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customTemplates));
    return true;
  }

  /**
   * Delete a custom template
   */
  async deleteCustomTemplate(templateId: string): Promise<boolean> {
    const customTemplates = await this.getCustomTemplates();
    const filtered = customTemplates.filter((t) => t.id !== templateId);

    if (filtered.length === customTemplates.length) return false;

    await AsyncStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(filtered));
    return true;
  }

  /**
   * Fill template with variable values
   */
  fillTemplate(template: VisitNoteTemplate, values: Record<string, string>): string {
    let filledText = template.text;

    for (const variable of template.variables) {
      const value = values[variable.key] || variable.defaultValue || `[${variable.label}]`;
      filledText = filledText.replace(`[${variable.key}]`, value);
    }

    return filledText;
  }

  /**
   * Auto-fill template from care plan data
   */
  autoFillFromCarePlan(template: VisitNoteTemplate, carePlan: CarePlanData): Record<string, string> {
    const autoFilled: Record<string, string> = {};

    for (const variable of template.variables) {
      // Map care plan data to template variables
      if (variable.key.includes('DIET') && carePlan.dietRestrictions?.length) {
        autoFilled[variable.key] = carePlan.dietRestrictions.join(', ');
      }
      if (variable.key.includes('MOBILITY') && carePlan.mobilityLevel) {
        autoFilled[variable.key] = carePlan.mobilityLevel;
      }
      if (variable.key.includes('MEDICATIONS') && carePlan.medications?.length) {
        autoFilled[variable.key] = carePlan.medications.join(', ');
      }
      // Add more mappings as needed
    }

    return autoFilled;
  }

  /**
   * Get category display info
   */
  getCategoryInfo(category: TemplateCategory): { label: string; icon: string; color: string } {
    const info: Record<TemplateCategory, { label: string; icon: string; color: string }> = {
      personal_care: { label: 'Personal Care', icon: '🛁', color: '#8B5CF6' },
      medication: { label: 'Medication', icon: '💊', color: '#EF4444' },
      meal_prep: { label: 'Meal Prep', icon: '🍽️', color: '#F59E0B' },
      companionship: { label: 'Companionship', icon: '💬', color: '#10B981' },
      transportation: { label: 'Transportation', icon: '🚗', color: '#3B82F6' },
      housekeeping: { label: 'Housekeeping', icon: '🧹', color: '#6366F1' },
      vital_signs: { label: 'Vital Signs', icon: '❤️', color: '#EC4899' },
      mobility: { label: 'Mobility', icon: '🚶', color: '#14B8A6' },
      general: { label: 'General', icon: '📝', color: '#6B7280' },
      custom: { label: 'Custom', icon: '⭐', color: '#F97316' },
    };
    return info[category];
  }

  /**
   * Get all categories
   */
  getAllCategories(): TemplateCategory[] {
    return [
      'personal_care',
      'medication',
      'meal_prep',
      'companionship',
      'transportation',
      'housekeeping',
      'vital_signs',
      'mobility',
      'general',
      'custom',
    ];
  }

  /**
   * Clear all custom templates (for testing)
   */
  async clearCustomTemplates(): Promise<void> {
    await AsyncStorage.removeItem(CUSTOM_TEMPLATES_KEY);
  }
}

export const visitNotesTemplateService = new VisitNotesTemplateService();
