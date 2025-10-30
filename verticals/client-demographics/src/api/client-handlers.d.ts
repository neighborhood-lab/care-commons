import { Request, Response, NextFunction } from 'express';
import { ClientService } from '../service/client-service';
export declare class ClientHandlers {
    private clientService;
    constructor(clientService: ClientService);
    listClients: (req: Request, res: Response, next: NextFunction) => void;
    getClient: (req: Request, res: Response, next: NextFunction) => void;
    getClientByNumber: (req: Request, res: Response, next: NextFunction) => void;
    createClient: (req: Request, res: Response, next: NextFunction) => void;
    updateClient: (req: Request, res: Response, next: NextFunction) => void;
    deleteClient: (req: Request, res: Response, next: NextFunction) => void;
    addEmergencyContact: (req: Request, res: Response, next: NextFunction) => void;
    updateEmergencyContact: (req: Request, res: Response, next: NextFunction) => void;
    removeEmergencyContact: (req: Request, res: Response, next: NextFunction) => void;
    addRiskFlag: (req: Request, res: Response, next: NextFunction) => void;
    resolveRiskFlag: (req: Request, res: Response, next: NextFunction) => void;
    updateClientStatus: (req: Request, res: Response, next: NextFunction) => void;
    getClientSummary: (req: Request, res: Response, next: NextFunction) => void;
    getClientsByBranch: (req: Request, res: Response, next: NextFunction) => void;
    bulkImportClients: (req: Request, res: Response, next: NextFunction) => void;
    getClientAuditTrail: (req: Request, res: Response, next: NextFunction) => void;
    getDashboardStats: (req: Request, res: Response, next: NextFunction) => void;
}
export declare function createClientRouter(clientService: ClientService): any;
//# sourceMappingURL=client-handlers.d.ts.map