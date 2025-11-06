import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...((process.env.NODE_ENV ?? '') === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  }),
  ...(process.env.NODE_ENV === 'production' && {
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
