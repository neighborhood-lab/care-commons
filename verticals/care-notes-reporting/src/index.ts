/**
 * @care-commons/care-notes-reporting
 *
 * Care Notes & Progress Reporting vertical
 */

// Types
export * from './types/care-note.js';

// Repository
export { CareNoteRepository } from './repository/care-note-repository.js';

// Service
export { CareNoteService } from './service/care-note-service.js';

// API Handlers
export {
  createCareNoteHandlers,
  createCareNoteRouter,
} from './api/care-note-handlers.js';
