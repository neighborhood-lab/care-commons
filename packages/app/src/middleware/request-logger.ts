/**
 * Request logging middleware
 */

import morgan, { type Options } from 'morgan';
import { Request, Response } from 'express';
import type { RequestHandler } from 'express';

/**
 * Create request logger based on environment
 */
export function createRequestLogger(): RequestHandler {
  const format = process.env['NODE_ENV'] === 'production'
    ? 'combined'  // Apache combined format
    : 'dev';      // Colored development format

  const options: Options<Request, Response> = {
    skip: (req: Request) => {
      // Skip health check endpoint logging to reduce noise
      return req.url === '/health';
    },
  };

  return morgan(format, options);
}
