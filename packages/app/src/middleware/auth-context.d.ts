import { Request, Response, NextFunction } from 'express';
import { UserContext } from '@care-commons/core';
declare global {
    namespace Express {
        interface Request {
            userContext?: UserContext;
        }
    }
}
export declare function authContextMiddleware(req: Request, _res: Response, next: NextFunction): void;
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth-context.d.ts.map