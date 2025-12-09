/**
 * Visit Notes Vertical - Public API
 *
 * Rich text visit notes with templates, voice-to-text, and digital signatures.
 */

// Types
export type {
  VisitNote,
  VisitNoteType,
  ClientMood,
  IncidentSeverity,
  SignerRelationship,
  VisitNoteTemplate,
  TemplateCategory,
  TemplatePrompt,
  SignatureData,
  CreateVisitNoteInput,
  UpdateVisitNoteInput,
  AddSignatureInput,
  CreateNoteTemplateInput,
  UpdateNoteTemplateInput,
  VisitNoteSearchFilters,
  TemplateSearchFilters,
  VisitNoteWithTemplate,
  VisitNoteWithDetails,
} from './types/index.js';

// Validation
export {
  visitNoteTypeSchema,
  clientMoodSchema,
  incidentSeveritySchema,
  signerRelationshipSchema,
  templateCategorySchema,
  templatePromptSchema,
  signatureDataSchema,
  createVisitNoteSchema,
  updateVisitNoteSchema,
  addSignatureSchema,
  createNoteTemplateSchema,
  updateNoteTemplateSchema,
  visitNoteSearchFiltersSchema,
  templateSearchFiltersSchema,
  complianceCheckRequestSchema,
  type ComplianceCheckRequestInput,
} from './validation/index.js';

// Repositories
export { NoteTemplateRepository } from './repository/note-template-repository.js';
export { VisitNoteRepository } from './repository/visit-note-repository.js';

// Voice Transcription (FREE AI)
export {
  VoiceTranscriptionService,
  createVoiceTranscriptionService,
  type TranscriptionResult,
  type StructuredNoteData,
} from './services/voice-transcription-service.js';

// Note Autofill (AI-powered suggestions)
export {
  NoteAutofillService,
  createNoteAutofillService,
  type AutofillServiceConfig,
  type AutofillSuggestions,
  type AutofillRequest,
} from './services/note-autofill-service.js';

// Compliance Checking (AI-powered regulatory compliance)
export {
  ComplianceCheckingService,
  type ComplianceCheckRequest,
  type ComplianceCheckResult,
  type ComplianceCategory,
  type ComplianceStatus,
  type ComplianceViolation,
  type VisitComplianceResult,
} from './services/compliance-checking-service.js';

// Documentation Quality (AI-powered scoring)
export {
  DocumentationQualityService,
  type QualityScoreRequest,
  type DocumentationQualityResult,
  type DimensionScore,
  type QualityDimension,
} from './services/documentation-quality-service.js';

// Hospitalization Risk (AI-powered prediction)
export {
  HospitalizationRiskService,
  type HospitalizationRiskRequest,
  type HospitalizationRiskResult,
  type RiskLevel,
  type RiskFactor,
} from './services/hospitalization-risk-service.js';

// Vitals Anomaly Detection (AI-powered monitoring)
export {
  VitalsAnomalyService,
  type VitalsAnomalyRequest,
  type VitalsAnomalyResult,
  type VitalAnomaly,
  type AnomalySeverity,
} from './services/vitals-anomaly-service.js';

// Sentiment Analysis (AI-powered emotional pattern detection)
export {
  SentimentAnalysisService,
  type SentimentAnalysisRequest,
  type SentimentAnalysisResult,
  type SentimentCategory,
  type ConcernType,
  type ConcernAlert,
  type SentimentTrend,
} from './services/sentiment-analysis-service.js';

// Report Generation (AI-powered narrative reports)
export {
  ReportGenerationService,
  type ReportGenerationRequest,
  type GeneratedReport,
  type ReportSection,
  type ReportType,
  type ReportFormat,
} from './services/report-generation-service.js';

// Routes
export { createVisitNotesHandlers } from './routes/index.js';
