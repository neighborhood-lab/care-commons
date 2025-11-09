import { Request, Response, NextFunction } from 'express';

interface ThrottleOptions {
  maxConcurrent: number;
  queueSize: number;
  timeout: number; // milliseconds
}

const userQueues = new Map<string, number>();

export const throttle = (options: ThrottleOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // @ts-expect-error - req.user is added by auth middleware
    const userId: string = req.user?.id ?? req.ip ?? 'unknown';

    const currentConcurrent = userQueues.get(userId) ?? 0;

    if (currentConcurrent >= options.maxConcurrent) {
      res.status(429).json({
        error: 'Too many concurrent requests. Please wait for previous requests to complete.',
      });
      return;
    }

    // Increment concurrent request count
    userQueues.set(userId, currentConcurrent + 1);

    // Set timeout
    const timeoutId = setTimeout(() => {
      // Decrement on timeout
      const count = userQueues.get(userId) ?? 1;
      userQueues.set(userId, Math.max(0, count - 1));
    }, options.timeout);

    // Wrap response to decrement on completion
    const originalSend = res.send;
    res.send = function (data) {
      clearTimeout(timeoutId);
      const count = userQueues.get(userId) ?? 1;
      userQueues.set(userId, Math.max(0, count - 1));
      return originalSend.call(this, data);
    };

    next();
  };
};
