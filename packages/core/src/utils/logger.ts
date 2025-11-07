import pino from 'pino';

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const isDevelopment = (process.env.NODE_ENV ?? '') === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL ?? (isTest ? 'silent' : 'info'),
  // In test environments, avoid worker threads by not using transport
  // In development, use pino-pretty for readable logs
  // In production, use JSON format
  ...(isDevelopment && !isTest && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  }),
  ...(isProduction && {
    // JSON logging for production (easier to parse)
    formatters: {
      level: (label) => {
        return { level: label };
      }
    }
  })
});

export default logger;
export { logger }; // Named export for easier importing

// Convenience methods with context
export const createLogger = (context: string): pino.Logger => {
  return logger.child({ context });
};

// Usage example:
// const log = createLogger('VisitService');
// log.info({ visitId: '123' }, 'Visit created successfully');
// log.error({ error, visitId: '123' }, 'Failed to create visit');
