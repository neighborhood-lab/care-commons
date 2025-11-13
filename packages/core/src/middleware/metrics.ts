import { Request, Response, NextFunction } from 'express';
import { httpRequestCounter, httpRequestDuration } from '../utils/metrics';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestCounter.inc({
      method: req.method,
      route: req.route?.path ?? req.path,
      status_code: res.statusCode
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path ?? req.path,
        status_code: res.statusCode
      },
      duration
    );
  });

  next();
}
