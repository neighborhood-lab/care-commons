/**
 * @care-commons/care-plans-tasks
 * 
 * Care Plans & Tasks Library vertical
 */

// Types
export * from './types/care-plan';

// Validation
export { CarePlanValidator } from './validation/care-plan-validator';

// Repository
export { CarePlanRepository } from './repository/care-plan-repository';

// Service
export { CarePlanService } from './service/care-plan-service';
export { TemplateService } from './service/template.service';

// Templates
export {
  CARE_PLAN_TEMPLATES,
  CarePlanTemplate,
  CarePlanTemplateCategory,
  TemplateTaskCategory,
  TemplateFrequency,
  TemplatePriority,
  TaskTemplate as CarePlanTaskTemplate,
  getAllTemplates,
  getTemplateById,
  getTemplatesByCategory,
  mapTaskCategory,
  mapFrequency,
} from './templates/care-plan-templates';

// API Handlers
export { createCarePlanHandlers } from './api/care-plan-handlers';
