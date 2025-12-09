/**
 * @folkcare/care-plans-tasks
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

// Task Prioritization Service
export {
  TaskPrioritizationService,
  createTaskPrioritizationService,
  type TaskPrioritizationConfig,
  type PrioritizedTask,
  type PrioritizeTasksRequest,
  type TaskPrioritizationResult,
} from './services/task-prioritization-service';

// Task Prioritization Routes
export { createTaskPrioritizationRoutes } from './routes/task-prioritization-routes';

// Natural Language Care Plan Service (AI-powered)
export {
  NaturalLanguageCarePlanService,
  createNaturalLanguageCarePlanService,
  type NaturalLanguageCarePlanRequest,
  type NaturalLanguageCarePlanResult,
  type GeneratedGoal,
  type GeneratedIntervention,
  type GeneratedTaskTemplate,
} from './services/natural-language-care-plan-service';

// Natural Language Care Plan Routes
export { createNaturalLanguageCarePlanRoutes } from './routes/natural-language-care-plan-routes';
