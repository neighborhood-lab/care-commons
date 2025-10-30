import { Pool } from 'pg';
import { UUID } from '@care-commons/core';
import { PayPeriod, PayRun, TimeSheet, TimeSheetAdjustment, PayPeriodType, PayRunType } from '../types/payroll';
export interface CreatePayPeriodInput {
    organizationId: UUID;
    branchId?: UUID;
    periodNumber: number;
    periodYear: number;
    periodType: PayPeriodType;
    startDate: Date;
    endDate: Date;
    payDate: Date;
    cutoffDate?: Date;
    approvalDeadline?: Date;
    notes?: string;
}
export interface CompileTimeSheetInput {
    organizationId: UUID;
    branchId: UUID;
    payPeriodId: UUID;
    caregiverId: UUID;
    caregiverName: string;
    caregiverEmployeeId: string;
    evvRecordIds: UUID[];
    regularRate: number;
}
export interface CreatePayRunInput {
    organizationId: UUID;
    branchId?: UUID;
    payPeriodId: UUID;
    runType: PayRunType;
    notes?: string;
}
export interface ApproveTimeSheetInput {
    timeSheetId: UUID;
    approvalNotes?: string;
}
export declare class PayrollService {
    private pool;
    private repository;
    constructor(pool: Pool);
    createPayPeriod(input: CreatePayPeriodInput, userId: UUID): Promise<PayPeriod>;
    compileTimeSheet(input: CompileTimeSheetInput, userId: UUID): Promise<TimeSheet>;
    addTimeSheetAdjustment(timeSheetId: UUID, adjustment: Omit<TimeSheetAdjustment, 'id' | 'addedAt' | 'addedBy'>, userId: UUID): Promise<void>;
    approveTimeSheet(input: ApproveTimeSheetInput, userId: UUID): Promise<void>;
    createPayRun(input: CreatePayRunInput, userId: UUID): Promise<PayRun>;
    private calculatePayStub;
    private detectTimeSheetDiscrepancies;
    private generateRunNumber;
    private generateStubNumber;
    private fetchEVVRecords;
    private convertEVVToTimeSheetEntries;
    private calculateHours;
    private calculateEarnings;
    private calculateOvertime;
    approvePayRun(payRunId: UUID, userId: UUID): Promise<void>;
    openPayPeriod(payPeriodId: UUID, userId: UUID): Promise<void>;
    lockPayPeriod(payPeriodId: UUID, userId: UUID): Promise<void>;
}
//# sourceMappingURL=payroll-service.d.ts.map