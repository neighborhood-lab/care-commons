# Task 0026: Care Plan Templates Library

**Priority**: 🟡 MEDIUM
**Phase**: Phase 2 - Feature Completeness
**Estimated Effort**: 6-8 hours

## Context

Coordinators spend significant time creating care plans from scratch. A library of templates for common care scenarios speeds up care plan creation and ensures consistency in care delivery.

## Problem Statement

**Current Issues**:
- Coordinators recreate similar care plans repeatedly
- Inconsistent task sets for similar clients
- Time-consuming care plan creation
- New coordinators don't know what tasks to include

**Impact**:
- Slow client onboarding
- Inconsistent care quality
- Higher coordinator workload
- Learning curve for new staff

## Task

### 1. Define Care Plan Templates

**File**: `verticals/care-plans-tasks/src/templates/care-plan-templates.ts`

```typescript
export interface CarePlanTemplate {
  id: string;
  name: string;
  description: string;
  category: 'personal_care' | 'skilled_nursing' | 'companionship' | 'memory_care' | 'post_hospital';
  typical_duration_days: number;
  goals: string;
  tasks: TaskTemplate[];
}

export interface TaskTemplate {
  description: string;
  category: 'medication' | 'vital_signs' | 'personal_care' | 'meal_prep' | 'mobility' | 'safety_check' | 'documentation' | 'other';
  frequency: 'once' | 'daily' | 'weekly' | 'as_needed';
  scheduled_time?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_duration_minutes: number;
  instructions?: string;
}

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
        instructions: 'Ensure water temperature is safe. Use non-slip mat. Assist as needed while maintaining client dignity.'
      },
      {
        description: 'Assist with dressing',
        category: 'personal_care',
        frequency: 'daily',
        scheduled_time: '09:45',
        priority: 'medium',
        estimated_duration_minutes: 20,
        instructions: 'Allow client to choose clothing. Assist as needed. Check for skin irritation or pressure sores.'
      },
      {
        description: 'Prepare and assist with meals',
        category: 'meal_prep',
        frequency: 'daily',
        scheduled_time: '12:00',
        priority: 'high',
        estimated_duration_minutes: 60,
        instructions: 'Follow dietary restrictions. Ensure adequate hydration. Note any changes in appetite.'
      },
      {
        description: 'Light housekeeping',
        category: 'other',
        frequency: 'daily',
        priority: 'low',
        estimated_duration_minutes: 30,
        instructions: 'Maintain clean and safe environment. Focus on high-traffic areas.'
      },
      {
        description: 'Medication reminder',
        category: 'medication',
        frequency: 'daily',
        scheduled_time: '08:00',
        priority: 'critical',
        estimated_duration_minutes: 10,
        instructions: 'Verify medications against list. Observe client taking medication. Document.'
      },
      {
        description: 'Safety check',
        category: 'safety_check',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 10,
        instructions: 'Check for hazards. Ensure emergency devices are working. Verify contact information is current.'
      }
    ]
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
        instructions: 'Record all vitals. Report abnormal readings immediately. Know client baseline values.'
      },
      {
        description: 'Medication administration per doctor orders',
        category: 'medication',
        frequency: 'daily',
        priority: 'critical',
        estimated_duration_minutes: 20,
        instructions: 'Follow hospital discharge instructions exactly. Watch for side effects. Document administration.'
      },
      {
        description: 'Wound care and dressing changes',
        category: 'other',
        frequency: 'daily',
        priority: 'critical',
        estimated_duration_minutes: 30,
        instructions: 'Follow sterile technique. Check for signs of infection. Document wound appearance.'
      },
      {
        description: 'Assist with prescribed exercises',
        category: 'mobility',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 30,
        instructions: 'Follow physical therapy plan. Do not overexert client. Report pain or difficulty.'
      },
      {
        description: 'Monitor food and fluid intake',
        category: 'meal_prep',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 15,
        instructions: 'Document intake. Watch for appetite changes. Ensure adequate hydration.'
      },
      {
        description: 'Communication with family and care team',
        category: 'documentation',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 20,
        instructions: 'Update family on progress. Report concerns to coordinator. Document all communications.'
      }
    ]
  },

  {
    id: 'memory-care-dementia',
    name: 'Memory Care (Dementia/Alzheimer\'s)',
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
        instructions: 'Maintain consistent schedule. Use visual cues. Reduce changes and surprises.'
      },
      {
        description: 'Cognitive stimulation activities',
        category: 'other',
        frequency: 'daily',
        scheduled_time: '14:00',
        priority: 'medium',
        estimated_duration_minutes: 60,
        instructions: 'Use memory games, music, reminiscence therapy. Adapt to client ability level.'
      },
      {
        description: 'Safety monitoring',
        category: 'safety_check',
        frequency: 'daily',
        priority: 'critical',
        estimated_duration_minutes: 30,
        instructions: 'Prevent wandering. Remove hazards. Monitor for agitation or sundowning.'
      },
      {
        description: 'Personal care with reassurance',
        category: 'personal_care',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 60,
        instructions: 'Use calm, simple language. Allow extra time. Maintain dignity and respect.'
      },
      {
        description: 'Medication management',
        category: 'medication',
        frequency: 'daily',
        priority: 'critical',
        estimated_duration_minutes: 15,
        instructions: 'Supervise all medications. Watch for side effects. Report behavioral changes.'
      },
      {
        description: 'Document behavior and mood changes',
        category: 'documentation',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 15,
        instructions: 'Note triggers for agitation. Track sleep patterns. Document appetite and hydration.'
      }
    ]
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
        instructions: 'Engage in meaningful conversation. Discuss interests, memories, current events.'
      },
      {
        description: 'Assist with errands and shopping',
        category: 'other',
        frequency: 'weekly',
        priority: 'medium',
        estimated_duration_minutes: 120,
        instructions: 'Help with grocery shopping, pharmacy pickups, appointments.'
      },
      {
        description: 'Light meal preparation',
        category: 'meal_prep',
        frequency: 'daily',
        priority: 'medium',
        estimated_duration_minutes: 45,
        instructions: 'Prepare simple, nutritious meals. Follow any dietary restrictions.'
      },
      {
        description: 'Recreation and activities',
        category: 'other',
        frequency: 'daily',
        priority: 'medium',
        estimated_duration_minutes: 60,
        instructions: 'Games, puzzles, crafts, walks, gardening based on client interests.'
      },
      {
        description: 'Medication reminder',
        category: 'medication',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 10,
        instructions: 'Remind client to take medications. Client self-administers.'
      }
    ]
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
        instructions: 'Test before meals and at bedtime. Record all readings. Know client target range.'
      },
      {
        description: 'Insulin administration',
        category: 'medication',
        frequency: 'daily',
        priority: 'critical',
        estimated_duration_minutes: 15,
        instructions: 'Follow doctor orders precisely. Rotate injection sites. Monitor for reactions.'
      },
      {
        description: 'Foot care and inspection',
        category: 'personal_care',
        frequency: 'daily',
        priority: 'high',
        estimated_duration_minutes: 20,
        instructions: 'Check for cuts, blisters, redness. Keep feet clean and dry. Report any concerns.'
      },
      {
        description: 'Meal planning and monitoring',
        category: 'meal_prep',
        frequency: 'daily',
        priority: 'critical',
        estimated_duration_minutes: 60,
        instructions: 'Follow diabetic diet plan. Count carbohydrates. Ensure consistent meal times.'
      },
      {
        description: 'Education on diabetes management',
        category: 'documentation',
        frequency: 'weekly',
        priority: 'high',
        estimated_duration_minutes: 30,
        instructions: 'Teach about diet, exercise, medication. Empower client for self-care.'
      },
      {
        description: 'Monitor for hypo/hyperglycemia',
        category: 'safety_check',
        frequency: 'daily',
        priority: 'critical',
        estimated_duration_minutes: 15,
        instructions: 'Know symptoms. Have glucose tablets available. Know emergency protocol.'
      }
    ]
  }
];
```

### 2. Create Template Service

**File**: `verticals/care-plans-tasks/src/services/template.service.ts`

```typescript
import { CARE_PLAN_TEMPLATES, CarePlanTemplate } from '../templates/care-plan-templates';

export class TemplateSservice {
  /**
   * Get all care plan templates
   */
  getAllTemplates(): CarePlanTemplate[] {
    return CARE_PLAN_TEMPLATES;
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): CarePlanTemplate | undefined {
    return CARE_PLAN_TEMPLATES.find(t => t.id === id);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): CarePlanTemplate[] {
    return CARE_PLAN_TEMPLATES.filter(t => t.category === category);
  }

  /**
   * Create care plan from template
   */
  async createFromTemplate(
    templateId: string,
    clientId: string,
    customizations?: Partial<CarePlan>
  ): Promise<CarePlan> {
    const template = this.getTemplateById(templateId);
    if (!template) throw new Error('Template not found');

    // Create care plan from template
    const carePlan = {
      client_id: clientId,
      name: customizations?.name || template.name,
      goals: customizations?.goals || template.goals,
      start_date: customizations?.start_date || new Date(),
      end_date: customizations?.end_date || addDays(new Date(), template.typical_duration_days),
      status: 'draft',
      ...customizations
    };

    const [createdPlan] = await this.db('care_plans')
      .insert(carePlan)
      .returning('*');

    // Create tasks from template
    for (const taskTemplate of template.tasks) {
      await this.db('care_plan_tasks').insert({
        care_plan_id: createdPlan.id,
        ...taskTemplate,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    return createdPlan;
  }
}
```

### 3. Add Template Selection UI

**File**: `packages/web/src/pages/care-plans/CreateFromTemplatePage.tsx`

```typescript
const CreateFromTemplatePage = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<CarePlanTemplate | null>(null);
  const { data: templates } = useCarePlanTemplates();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create Care Plan from Template</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => setSelectedTemplate(template)}
          />
        ))}
      </div>

      {selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
};

const TemplateCard = ({ template, onSelect }) => (
  <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
       onClick={onSelect}>
    <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
    <p className="text-gray-600 text-sm mb-4">{template.description}</p>

    <div className="space-y-2">
      <div className="flex items-center text-sm text-gray-500">
        <span className="font-medium mr-2">Duration:</span>
        {template.typical_duration_days} days
      </div>
      <div className="flex items-center text-sm text-gray-500">
        <span className="font-medium mr-2">Tasks:</span>
        {template.tasks.length} tasks
      </div>
    </div>

    <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
      Use Template
    </button>
  </div>
);
```

### 4. Add Template Customization

Allow coordinators to customize templates before creating:

```typescript
const TemplateCustomizationForm = ({ template, clientId }) => {
  const [customTasks, setCustomTasks] = useState(template.tasks);

  const handleTaskToggle = (taskIndex: number) => {
    setCustomTasks(prev =>
      prev.map((task, i) =>
        i === taskIndex ? { ...task, enabled: !task.enabled } : task
      )
    );
  };

  const handleCreateCarePlan = async () => {
    const enabledTasks = customTasks.filter(t => t.enabled);
    await createCarePlanFromTemplate(template.id, clientId, {
      tasks: enabledTasks
    });
  };

  return (
    <div>
      <h2>Customize Care Plan</h2>

      <div className="space-y-4">
        {customTasks.map((task, index) => (
          <div key={index} className="border rounded p-4 flex items-start">
            <input
              type="checkbox"
              checked={task.enabled}
              onChange={() => handleTaskToggle(index)}
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <h4 className="font-medium">{task.description}</h4>
              <p className="text-sm text-gray-600">{task.instructions}</p>
              <div className="mt-2 text-xs text-gray-500">
                {task.frequency} · {task.estimated_duration_minutes} min · {task.priority} priority
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleCreateCarePlan}
        className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg"
      >
        Create Care Plan ({customTasks.filter(t => t.enabled).length} tasks)
      </button>
    </div>
  );
};
```

### 5. Add Custom Templates (Admin)

Allow agencies to create custom templates:

```typescript
// Store custom templates in database
await this.db('care_plan_templates').insert({
  agency_id: agencyId,
  name: 'Custom Template',
  description: 'Agency-specific template',
  category: 'personal_care',
  tasks: JSON.stringify(tasks),
  created_by: userId,
  is_active: true
});
```

## Acceptance Criteria

- [ ] 5+ care plan templates defined
- [ ] Template service created
- [ ] UI to browse templates
- [ ] UI to preview template tasks
- [ ] Create care plan from template
- [ ] Customize template before creating
- [ ] Custom agency templates (optional)
- [ ] Templates categorized
- [ ] Documentation for adding templates
- [ ] Tests for template service

## Testing Checklist

1. **Template Creation**:
   - Select template → Preview → Create → Verify care plan and tasks created
2. **Customization**:
   - Select template → Remove some tasks → Create → Verify only selected tasks included
3. **Categories**:
   - Filter by category → Verify correct templates shown

## Definition of Done

- ✅ Template library implemented
- ✅ UI for template selection
- ✅ Care plans can be created from templates
- ✅ Templates can be customized
- ✅ Tests passing
- ✅ Documentation complete

## Priority Justification

This is **MEDIUM** priority because:
1. Speeds up care plan creation
2. Ensures consistency
3. Helps new coordinators
4. Not production-blocking but high value

---

**Previous Task**: 0025 - Geocoding Automation
