import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    details?: unknown;
}
export declare function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void;
export declare function notFoundHandler(_req: Request, res: Response): void;
//# sourceMappingURL=error-handler.d.ts.map