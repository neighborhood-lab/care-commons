/**
 * @care-commons/care-plans-tasks/browser
 *
 * Browser-safe exports from care-plans-tasks package
 * This file excludes server-only modules (repositories, services)
 */

// Types
export * from './types/care-plan';

// Templates (browser-safe data)
export {
  CARE_PLAN_TEMPLATES,
  type CarePlanTemplate,
  type CarePlanTemplateCategory,
  type TemplateTaskCategory,
  type TemplateFrequency,
  type TemplatePriority,
  type TaskTemplate as CarePlanTaskTemplate,
  getAllTemplates,
  getTemplateById,
  getTemplatesByCategory,
  mapTaskCategory,
  mapFrequency,
} from './templates/care-plan-templates';
