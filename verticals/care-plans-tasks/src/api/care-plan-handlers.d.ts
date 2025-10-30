import { Request, Response } from 'express';
import { CarePlanService } from '../service/care-plan-service';
export declare function createCarePlanHandlers(service: CarePlanService): {
    createCarePlan(req: Request, res: Response): Promise<void>;
    getCarePlanById(req: Request, res: Response): Promise<void>;
    updateCarePlan(req: Request, res: Response): Promise<void>;
    activateCarePlan(req: Request, res: Response): Promise<void>;
    searchCarePlans(req: Request, res: Response): Promise<void>;
    getCarePlansByClientId(req: Request, res: Response): Promise<void>;
    getActiveCarePlanForClient(req: Request, res: Response): Promise<void>;
    getExpiringCarePlans(req: Request, res: Response): Promise<void>;
    deleteCarePlan(req: Request, res: Response): Promise<void>;
    createTasksForVisit(req: Request, res: Response): Promise<void>;
    createTaskInstance(req: Request, res: Response): Promise<void>;
    getTaskInstanceById(req: Request, res: Response): Promise<void>;
    completeTask(req: Request, res: Response): Promise<void>;
    skipTask(req: Request, res: Response): Promise<void>;
    reportTaskIssue(req: Request, res: Response): Promise<void>;
    searchTaskInstances(req: Request, res: Response): Promise<void>;
    getTasksByVisitId(req: Request, res: Response): Promise<void>;
    createProgressNote(req: Request, res: Response): Promise<void>;
    getProgressNotesByCarePlanId(req: Request, res: Response): Promise<void>;
    getCarePlanAnalytics(req: Request, res: Response): Promise<void>;
    getTaskCompletionMetrics(req: Request, res: Response): Promise<void>;
};
export default createCarePlanHandlers;
//# sourceMappingURL=care-plan-handlers.d.ts.map