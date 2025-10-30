import { UserContext } from '@care-commons/core';
import { EVVService } from '../service/evv-service';
export interface APIRequest {
    body: any;
    params: Record<string, string>;
    query: Record<string, string>;
    user: UserContext;
}
export interface APIResponse {
    status: number;
    data?: any;
    error?: {
        message: string;
        code?: string;
        details?: any;
    };
}
export declare class EVVHandlers {
    private evvService;
    constructor(evvService: EVVService);
    clockIn(req: APIRequest): Promise<APIResponse>;
    clockOut(req: APIRequest): Promise<APIResponse>;
    applyManualOverride(req: APIRequest): Promise<APIResponse>;
    getEVVRecord(req: APIRequest): Promise<APIResponse>;
    getTimeEntries(req: APIRequest): Promise<APIResponse>;
    searchEVVRecords(req: APIRequest): Promise<APIResponse>;
    getComplianceSummary(req: APIRequest): Promise<APIResponse>;
    private handleError;
}
//# sourceMappingURL=evv-handlers.d.ts.map