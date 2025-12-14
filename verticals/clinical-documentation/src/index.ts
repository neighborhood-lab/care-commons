/**
 * Clinical Documentation Module
 *
 * Exports types, services, and repository for clinical visit notes.
 */

// Types
export * from './types/clinical.js';

// Service
export { ClinicalService } from './service/clinical-service.js';

// Repository
export { ClinicalRepository } from './repository/clinical-repository.js';

// Clinical Handoffs (SBAR, I-PASS)
export { ClinicalHandoffService } from './service/clinical-handoff-service.js';
export type {
  HandoffType,
  HandoffStatus,
  HandoffUrgency,
  SBARContent,
  IPassContent,
  ClinicalHandoff,
  CreateHandoffInput,
  AcknowledgeHandoffInput,
  DeclineHandoffInput,
  HandoffSummary,
} from './service/clinical-handoff-service.js';
export { createHandoffRoutes } from './api/handoff-routes.js';

// Lab Results
export { LabResultService } from './service/lab-result-service.js';
export type {
  LabInterpretation,
  LabSource,
  LabResultType,
  LabResult,
  CreateLabResultTypeInput,
  CreateLabResultInput,
  UpdateLabResultInput,
  LabResultTrend,
  LabResultSummary,
} from './service/lab-result-service.js';
export { createLabResultRoutes } from './api/lab-result-routes.js';

// Physician Communications
export { PhysicianCommunicationService } from './service/physician-communication-service.js';
export type {
  CommunicationType,
  CommunicationUrgency,
  ContactMethod,
  CommunicationStatus,
  PreferredContact,
  RelationshipType,
  Physician,
  ClientPhysician,
  PhysicianCommunication,
  CommunicationTemplate,
  CreatePhysicianInput,
  UpdatePhysicianInput,
  AddClientPhysicianInput,
  CreateCommunicationInput,
  RecordResponseInput,
  CommunicationSummary,
} from './service/physician-communication-service.js';
export { createPhysicianCommunicationRoutes } from './api/physician-communication-routes.js';

// Orders
export { OrderService } from './service/order-service.js';
export type {
  OrderType,
  OrderPriority,
  OrderSource,
  OrderStatus,
  OrderHistoryAction,
  Order,
  OrderHistory,
  OrderSet,
  OrderTemplate,
  CreateOrderInput,
  UpdateOrderInput,
  OrderSummary,
} from './service/order-service.js';
export { createOrderRoutes } from './api/order-routes.js';

// Patient Education
export { PatientEducationService } from './service/patient-education-service.js';
export type {
  EducationCategory,
  MaterialType,
  LearnerType,
  TeachingMethod,
  ComprehensionLevel,
  ReturnDemoResult,
  LearningBarrier,
  EducationTopic,
  EducationMaterial,
  PatientEducation,
  CreateEducationTopicInput,
  CreateEducationMaterialInput,
  CreatePatientEducationInput,
  UpdatePatientEducationInput,
  EducationSummary,
} from './service/patient-education-service.js';
export { createPatientEducationRoutes } from './api/patient-education-routes.js';

// Care Protocols
export { CareProtocolService } from './service/care-protocol-service.js';
export type {
  ProtocolType,
  ProtocolPriority,
  ComplianceStatus,
  ProtocolCategory,
  ProtocolStep,
  CareProtocol,
  ProtocolCompliance,
  CreateProtocolCategoryInput,
  CreateCareProtocolInput,
  UpdateCareProtocolInput,
  CreateProtocolComplianceInput,
  ProtocolSummary,
} from './service/care-protocol-service.js';
export { createCareProtocolRoutes } from './api/care-protocol-routes.js';
