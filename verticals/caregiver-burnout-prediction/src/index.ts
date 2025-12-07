/**
 * Caregiver Burnout Prediction Vertical
 *
 * Worker-first AI that predicts caregiver burnout risk from behavioral patterns
 * to enable proactive intervention and prevent turnover.
 */

// Types
export * from './types/burnout.js';

// Services
export { BurnoutService } from './service/burnout-service.js';
export { BurnoutCalculator, DEFAULT_BURNOUT_CONFIG } from './service/burnout-calculator.js';

// Repository
export { BurnoutRepository } from './repository/burnout-repository.js';

// Routes
export { createBurnoutRoutes } from './routes.js';
