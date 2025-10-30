"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollService = void 0;
const uuid_1 = require("uuid");
const payroll_repository_1 = require("../repository/payroll-repository");
const tax_calculations_1 = require("../utils/tax-calculations");
class PayrollService {
    constructor(pool) {
        this.pool = pool;
        this.repository = new payroll_repository_1.PayrollRepository(pool);
    }
    async createPayPeriod(input, userId) {
        const payPeriod = {
            organizationId: input.organizationId,
            branchId: input.branchId,
            periodNumber: input.periodNumber,
            periodYear: input.periodYear,
            periodType: input.periodType,
            startDate: input.startDate,
            endDate: input.endDate,
            payDate: input.payDate,
            status: 'DRAFT',
            statusHistory: [
                {
                    id: (0, uuid_1.v4)(),
                    fromStatus: null,
                    toStatus: 'DRAFT',
                    timestamp: new Date(),
                    changedBy: userId,
                    reason: 'Pay period created',
                },
            ],
            cutoffDate: input.cutoffDate,
            approvalDeadline: input.approvalDeadline,
            notes: input.notes,
            createdBy: userId,
            updatedBy: userId,
        };
        return this.repository.createPayPeriod(payPeriod);
    }
    async compileTimeSheet(input, userId) {
        const evvRecords = await this.fetchEVVRecords(input);
        const timeEntries = await this.convertEVVToTimeSheetEntries(evvRecords, input);
        const hoursCalculation = this.calculateHours(timeEntries);
        const earningsCalculation = this.calculateEarnings(hoursCalculation, input.regularRate);
        const overtimeCalculation = this.calculateOvertime(hoursCalculation, input.regularRate);
        const discrepancies = this.detectTimeSheetDiscrepancies(timeEntries, overtimeCalculation.totalHours);
        const timeSheet = {
            organizationId: input.organizationId,
            branchId: input.branchId,
            payPeriodId: input.payPeriodId,
            caregiverId: input.caregiverId,
            caregiverName: input.caregiverName,
            caregiverEmployeeId: input.caregiverEmployeeId,
            timeEntries,
            regularHours: overtimeCalculation.regularHours,
            overtimeHours: overtimeCalculation.overtimeHours,
            doubleTimeHours: overtimeCalculation.doubleTimeHours,
            ptoHours: 0,
            holidayHours: 0,
            sickHours: 0,
            otherHours: 0,
            totalHours: overtimeCalculation.totalHours,
            regularRate: input.regularRate,
            overtimeRate: input.regularRate * 1.5,
            doubleTimeRate: input.regularRate * 2.0,
            regularEarnings: earningsCalculation.regularEarnings,
            overtimeEarnings: earningsCalculation.overtimeEarnings,
            doubleTimeEarnings: earningsCalculation.doubleTimeEarnings,
            ptoEarnings: 0,
            holidayEarnings: 0,
            sickEarnings: 0,
            otherEarnings: 0,
            grossEarnings: earningsCalculation.grossEarnings,
            bonuses: [],
            reimbursements: [],
            adjustments: [],
            totalAdjustments: 0,
            totalGrossPay: earningsCalculation.grossEarnings,
            status: 'DRAFT',
            statusHistory: [
                {
                    id: (0, uuid_1.v4)(),
                    fromStatus: null,
                    toStatus: 'DRAFT',
                    timestamp: new Date(),
                    changedBy: userId,
                    reason: 'Timesheet compiled from EVV records',
                },
            ],
            hasDiscrepancies: discrepancies.length > 0,
            discrepancyFlags: discrepancies,
            evvRecordIds: input.evvRecordIds,
            visitIds: timeEntries.map(entry => entry.visitId),
            createdBy: userId,
            updatedBy: userId,
        };
        return this.repository.createTimeSheet(timeSheet);
    }
    async addTimeSheetAdjustment(timeSheetId, adjustment, userId) {
        const timeSheet = await this.repository.findTimeSheetById(timeSheetId);
        if (!timeSheet) {
            throw new Error('TimeSheet not found');
        }
        if (timeSheet.status !== 'DRAFT' && timeSheet.status !== 'SUBMITTED') {
            throw new Error(`Cannot add adjustment to timesheet in ${timeSheet.status} status`);
        }
        const fullAdjustment = {
            ...adjustment,
            id: (0, uuid_1.v4)(),
            addedAt: new Date(),
            addedBy: userId,
        };
        let updatedBonuses = timeSheet.bonuses;
        let updatedReimbursements = timeSheet.reimbursements;
        let updatedAdjustments = timeSheet.adjustments;
        let totalAdjustments = timeSheet.totalAdjustments;
        if (adjustment.adjustmentType === 'BONUS') {
            updatedBonuses = [...timeSheet.bonuses, fullAdjustment];
            totalAdjustments += adjustment.amount;
        }
        else if (adjustment.adjustmentType === 'REIMBURSEMENT' || adjustment.adjustmentType === 'MILEAGE') {
            updatedReimbursements = [...timeSheet.reimbursements, fullAdjustment];
            totalAdjustments += adjustment.amount;
        }
        else {
            updatedAdjustments = [...timeSheet.adjustments, fullAdjustment];
            totalAdjustments += adjustment.amount;
        }
        const updated = {
            ...timeSheet,
            bonuses: updatedBonuses,
            reimbursements: updatedReimbursements,
            adjustments: updatedAdjustments,
            totalAdjustments,
            totalGrossPay: timeSheet.grossEarnings + totalAdjustments,
            updatedBy: userId,
        };
        await this.repository.updateTimeSheet(timeSheetId, updated);
    }
    async approveTimeSheet(input, userId) {
        const timeSheet = await this.repository.findTimeSheetById(input.timeSheetId);
        if (!timeSheet) {
            throw new Error('TimeSheet not found');
        }
        if (timeSheet.status !== 'SUBMITTED' && timeSheet.status !== 'PENDING_REVIEW') {
            throw new Error(`Cannot approve timesheet in ${timeSheet.status} status`);
        }
        if (timeSheet.hasDiscrepancies) {
            const unresolvedFlags = timeSheet.discrepancyFlags?.filter((flag) => flag.requiresResolution && !flag.resolvedAt);
            if (unresolvedFlags && unresolvedFlags.length > 0) {
                throw new Error(`Cannot approve timesheet with ${unresolvedFlags.length} unresolved discrepancies`);
            }
        }
        const statusChange = {
            id: (0, uuid_1.v4)(),
            fromStatus: timeSheet.status,
            toStatus: 'APPROVED',
            timestamp: new Date(),
            changedBy: userId,
            reason: 'Timesheet approved for payroll',
            notes: input.approvalNotes,
        };
        await this.repository.updateTimeSheet(input.timeSheetId, {
            status: 'APPROVED',
            statusHistory: [...timeSheet.statusHistory, statusChange],
            approvedAt: new Date(),
            approvedBy: userId,
            approvalNotes: input.approvalNotes,
        });
    }
    async createPayRun(input, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const payPeriod = await this.repository.findPayPeriodById(input.payPeriodId);
            if (!payPeriod) {
                throw new Error('Pay period not found');
            }
            if (payPeriod.status !== 'LOCKED' && payPeriod.status !== 'PROCESSING') {
                throw new Error(`Pay period must be LOCKED before running payroll (current: ${payPeriod.status})`);
            }
            const timesheets = await this.repository.findTimeSheets({
                organizationId: input.organizationId,
                payPeriodId: input.payPeriodId,
                status: ['APPROVED'],
            });
            if (timesheets.length === 0) {
                throw new Error('No approved timesheets found for this pay period');
            }
            const runNumber = this.generateRunNumber(payPeriod.periodYear, payPeriod.periodNumber);
            const payStubIds = [];
            let totalGrossPay = 0;
            let totalNetPay = 0;
            let totalDeductions = 0;
            let totalTaxWithheld = 0;
            for (const timesheet of timesheets) {
                const payStub = await this.calculatePayStub(timesheet, payPeriod, userId, client);
                payStubIds.push(payStub.id);
                totalGrossPay += payStub.currentGrossPay;
                totalNetPay += payStub.currentNetPay;
                totalDeductions += payStub.totalOtherDeductions;
                totalTaxWithheld += payStub.totalTaxWithheld;
                const statusChange = {
                    id: (0, uuid_1.v4)(),
                    fromStatus: 'APPROVED',
                    toStatus: 'PROCESSING',
                    timestamp: new Date(),
                    changedBy: userId,
                    reason: 'Included in pay run',
                };
                await this.repository.updateTimeSheet(timesheet.id, {
                    status: 'PROCESSING',
                    statusHistory: [...timesheet.statusHistory, statusChange],
                });
            }
            const payRun = {
                organizationId: input.organizationId,
                branchId: input.branchId,
                payPeriodId: input.payPeriodId,
                payPeriodStartDate: payPeriod.startDate,
                payPeriodEndDate: payPeriod.endDate,
                payDate: payPeriod.payDate,
                runNumber,
                runType: input.runType,
                status: 'CALCULATED',
                statusHistory: [
                    {
                        id: (0, uuid_1.v4)(),
                        fromStatus: null,
                        toStatus: 'CALCULATED',
                        timestamp: new Date(),
                        changedBy: userId,
                        automatic: false,
                        reason: 'Pay run calculated',
                    },
                ],
                initiatedAt: new Date(),
                initiatedBy: userId,
                calculatedAt: new Date(),
                payStubIds,
                totalPayStubs: payStubIds.length,
                totalCaregivers: timesheets.length,
                totalHours: timesheets.reduce((sum, ts) => sum + ts.totalHours, 0),
                totalGrossPay,
                totalDeductions,
                totalTaxWithheld,
                totalNetPay,
                federalIncomeTax: 0,
                stateIncomeTax: 0,
                socialSecurityTax: 0,
                medicareTax: 0,
                localTax: 0,
                benefitsDeductions: 0,
                garnishments: 0,
                otherDeductions: 0,
                directDepositCount: 0,
                directDepositAmount: 0,
                checkCount: 0,
                checkAmount: 0,
                cashCount: 0,
                cashAmount: 0,
                compliancePassed: true,
                hasErrors: false,
                notes: input.notes,
                createdBy: userId,
                updatedBy: userId,
            };
            const createdPayRun = await this.repository.createPayRun(payRun, client);
            await this.repository.updatePayPeriod(input.payPeriodId, {
                payRunId: createdPayRun.id,
                status: 'PROCESSING',
            });
            await client.query('COMMIT');
            return createdPayRun;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async calculatePayStub(timesheet, payPeriod, userId, client) {
        const grossPay = timesheet.totalGrossPay;
        const taxConfig = {
            federalExempt: false,
            stateExempt: false,
            federalFilingStatus: 'SINGLE',
            w4Step3Dependents: 0,
            w4Step4aOtherIncome: 0,
            w4Step4bDeductions: 0,
            w4Step4cExtraWithholding: 0,
            stateFilingStatus: 'SINGLE',
            stateAllowances: 0,
            stateAdditionalWithholding: 0,
        };
        const periodTypeForTax = payPeriod.periodType === 'DAILY' || payPeriod.periodType === 'CUSTOM'
            ? 'WEEKLY'
            : payPeriod.periodType;
        const federalIncomeTax = (0, tax_calculations_1.calculateFederalIncomeTax)(grossPay, periodTypeForTax, taxConfig);
        const stateIncomeTax = (0, tax_calculations_1.calculateStateIncomeTax)(grossPay, 'TX', taxConfig);
        const socialSecurityTax = (0, tax_calculations_1.calculateSocialSecurityTax)(grossPay, 0);
        const medicareTax = (0, tax_calculations_1.calculateMedicareTax)(grossPay);
        const totalTaxWithheld = federalIncomeTax +
            stateIncomeTax +
            socialSecurityTax +
            medicareTax;
        const deductions = [];
        const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
        const netPay = grossPay - totalTaxWithheld - totalDeductions;
        const payStub = {
            organizationId: timesheet.organizationId,
            branchId: timesheet.branchId,
            payPeriodId: payPeriod.id,
            payRunId: undefined,
            caregiverId: timesheet.caregiverId,
            caregiverName: timesheet.caregiverName,
            caregiverEmployeeId: timesheet.caregiverEmployeeId,
            checkNumber: undefined,
            stubNumber: this.generateStubNumber(payPeriod, timesheet.caregiverId),
            payDate: payPeriod.payDate,
            payPeriodStartDate: payPeriod.startDate,
            payPeriodEndDate: payPeriod.endDate,
            timeSheetId: timesheet.id,
            regularHours: timesheet.regularHours,
            overtimeHours: timesheet.overtimeHours,
            doubleTimeHours: timesheet.doubleTimeHours,
            ptoHours: timesheet.ptoHours,
            holidayHours: timesheet.holidayHours,
            sickHours: timesheet.sickHours,
            otherHours: timesheet.otherHours,
            totalHours: timesheet.totalHours,
            regularPay: timesheet.regularEarnings,
            overtimePay: timesheet.overtimeEarnings,
            doubleTimePay: timesheet.doubleTimeEarnings,
            ptoPay: timesheet.ptoEarnings,
            holidayPay: timesheet.holidayEarnings,
            sickPay: timesheet.sickEarnings,
            otherPay: timesheet.otherEarnings,
            bonuses: timesheet.bonuses.reduce((sum, b) => sum + b.amount, 0),
            commissions: 0,
            reimbursements: timesheet.reimbursements.reduce((sum, r) => sum + r.amount, 0),
            retroactivePay: 0,
            otherEarnings: 0,
            currentGrossPay: grossPay,
            yearToDateGrossPay: grossPay,
            deductions,
            federalIncomeTax,
            stateIncomeTax,
            localIncomeTax: 0,
            socialSecurityTax,
            medicareTax,
            additionalMedicareTax: 0,
            totalTaxWithheld,
            healthInsurance: 0,
            dentalInsurance: 0,
            visionInsurance: 0,
            lifeInsurance: 0,
            retirement401k: 0,
            retirementRoth: 0,
            fsaHealthcare: 0,
            fsaDependentCare: 0,
            hsa: 0,
            garnishments: 0,
            unionDues: 0,
            otherDeductions: 0,
            totalOtherDeductions: totalDeductions,
            currentNetPay: netPay,
            yearToDateNetPay: netPay,
            ytdHours: timesheet.totalHours,
            ytdGrossPay: grossPay,
            ytdFederalTax: federalIncomeTax,
            ytdStateTax: stateIncomeTax,
            ytdSocialSecurity: socialSecurityTax,
            ytdMedicare: medicareTax,
            ytdDeductions: totalDeductions,
            ytdNetPay: netPay,
            paymentMethod: 'DIRECT_DEPOSIT',
            status: 'CALCULATED',
            statusHistory: [
                {
                    id: (0, uuid_1.v4)(),
                    fromStatus: null,
                    toStatus: 'CALCULATED',
                    timestamp: new Date(),
                    changedBy: userId,
                    reason: 'Pay stub calculated',
                },
            ],
            calculatedAt: new Date(),
            calculatedBy: userId,
            isVoid: false,
            createdBy: userId,
            updatedBy: userId,
        };
        return this.repository.createPayStub(payStub, client);
    }
    detectTimeSheetDiscrepancies(entries, totalHours) {
        const flags = [];
        if (totalHours > 80) {
            flags.push({
                flagType: 'EXCESSIVE_HOURS',
                severity: 'HIGH',
                description: `Total hours (${totalHours.toFixed(2)}) exceed 80 hours for the period`,
                requiresResolution: true,
            });
        }
        const dailyHours = new Map();
        entries.forEach(entry => {
            const dateKey = entry.workDate.toISOString().split('T')[0];
            dailyHours.set(dateKey, (dailyHours.get(dateKey) || 0) + entry.totalHours);
        });
        dailyHours.forEach((hours, date) => {
            if (hours > 16) {
                flags.push({
                    flagType: 'EXCESSIVE_HOURS',
                    severity: 'HIGH',
                    description: `Excessive hours (${hours.toFixed(2)}) on ${date}`,
                    requiresResolution: true,
                });
            }
        });
        const sortedEntries = [...entries].sort((a, b) => a.clockInTime.getTime() - b.clockInTime.getTime());
        for (let i = 0; i < sortedEntries.length - 1; i++) {
            const current = sortedEntries[i];
            const next = sortedEntries[i + 1];
            if (current.clockOutTime > next.clockInTime) {
                flags.push({
                    flagType: 'OVERLAPPING_SHIFTS',
                    severity: 'CRITICAL',
                    description: `Overlapping shifts: ${current.workDate.toDateString()} and ${next.workDate.toDateString()}`,
                    affectedEntryIds: [current.id, next.id],
                    requiresResolution: true,
                });
            }
        }
        entries.forEach(entry => {
            const durationHours = (entry.clockOutTime.getTime() - entry.clockInTime.getTime()) / (1000 * 60 * 60);
            if (durationHours > 24) {
                flags.push({
                    flagType: 'MISSING_CLOCK_OUT',
                    severity: 'HIGH',
                    description: `Possible missing clock-out for entry on ${entry.workDate.toDateString()} (${durationHours.toFixed(2)} hours)`,
                    affectedEntryIds: [entry.id],
                    requiresResolution: true,
                });
            }
        });
        entries.forEach(entry => {
            if (entry.totalHours < 0.25 && entry.totalHours > 0) {
                flags.push({
                    flagType: 'CALCULATION_ERROR',
                    severity: 'MEDIUM',
                    description: `Unusually short shift (${entry.totalHours.toFixed(2)} hours) on ${entry.workDate.toDateString()}`,
                    affectedEntryIds: [entry.id],
                    requiresResolution: false,
                });
            }
        });
        entries.forEach(entry => {
            if (entry.totalHours < 0) {
                flags.push({
                    flagType: 'CALCULATION_ERROR',
                    severity: 'CRITICAL',
                    description: `Negative hours detected for entry on ${entry.workDate.toDateString()}`,
                    affectedEntryIds: [entry.id],
                    requiresResolution: true,
                });
            }
        });
        entries.forEach(entry => {
            if (entry.clockOutTime < entry.clockInTime) {
                flags.push({
                    flagType: 'DATE_MISMATCH',
                    severity: 'CRITICAL',
                    description: `Clock-out time before clock-in time for entry on ${entry.workDate.toDateString()}`,
                    affectedEntryIds: [entry.id],
                    requiresResolution: true,
                });
            }
        });
        const entriesNeedingReview = entries.filter(entry => entry.requiresReview);
        if (entriesNeedingReview.length > 0) {
            flags.push({
                flagType: 'RATE_MISMATCH',
                severity: 'MEDIUM',
                description: `${entriesNeedingReview.length} entries require supervisor review`,
                affectedEntryIds: entriesNeedingReview.map(entry => entry.id),
                requiresResolution: true,
            });
        }
        return flags;
    }
    generateRunNumber(year, periodNumber) {
        return `${year}-${String(periodNumber).padStart(2, '0')}`;
    }
    generateStubNumber(payPeriod, caregiverId) {
        const periodCode = `${payPeriod.periodYear}-${String(payPeriod.periodNumber).padStart(2, '0')}`;
        const caregiverCode = caregiverId.substring(0, 8);
        return `${periodCode}-${caregiverCode}`;
    }
    async fetchEVVRecords(input) {
        const mockEVVRecords = input.evvRecordIds.map(id => ({
            id,
            visitId: (0, uuid_1.v4)(),
            organizationId: input.organizationId,
            branchId: input.branchId,
            clientId: (0, uuid_1.v4)(),
            caregiverId: input.caregiverId,
            serviceTypeCode: 'HCBS',
            serviceTypeName: 'Home Care',
            clientName: 'Client Name',
            caregiverName: input.caregiverName,
            caregiverEmployeeId: input.caregiverEmployeeId,
            serviceDate: new Date(),
            clockInTime: new Date(Date.now() - 8 * 60 * 60 * 1000),
            clockOutTime: new Date(),
            totalDuration: 480,
            recordStatus: 'COMPLETE',
            verificationLevel: 'FULL',
            complianceFlags: [],
            integrityHash: 'mock-hash',
            integrityChecksum: 'mock-checksum',
            recordedAt: new Date(),
            recordedBy: input.caregiverId,
            syncMetadata: {
                version: 1,
                lastSyncAt: new Date(),
                conflictResolved: false,
            },
        }));
        return mockEVVRecords;
    }
    async convertEVVToTimeSheetEntries(evvRecords, input) {
        return evvRecords.map(evvRecord => {
            const workDate = new Date(evvRecord.serviceDate);
            const clockInTime = new Date(evvRecord.clockInTime);
            const clockOutTime = evvRecord.clockOutTime ? new Date(evvRecord.clockOutTime) : new Date();
            const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
            const isWeekend = workDate.getDay() === 0 || workDate.getDay() === 6;
            const isNightShift = clockInTime.getHours() >= 20 || clockInTime.getHours() < 6;
            const isHoliday = false;
            const appliedMultipliers = [];
            let effectiveRate = input.regularRate;
            if (isWeekend) {
                appliedMultipliers.push({
                    multiplierType: 'WEEKEND',
                    multiplier: 1.25,
                    baseRate: input.regularRate,
                    appliedAmount: input.regularRate * 0.25,
                });
                effectiveRate *= 1.25;
            }
            if (isNightShift) {
                appliedMultipliers.push({
                    multiplierType: 'NIGHT_SHIFT',
                    multiplier: 1.15,
                    baseRate: input.regularRate,
                    appliedAmount: input.regularRate * 0.15,
                });
                effectiveRate *= 1.15;
            }
            if (isHoliday) {
                appliedMultipliers.push({
                    multiplierType: 'HOLIDAY',
                    multiplier: 1.5,
                    baseRate: input.regularRate,
                    appliedAmount: input.regularRate * 0.5,
                });
                effectiveRate *= 1.5;
            }
            return {
                id: (0, uuid_1.v4)(),
                visitId: evvRecord.visitId,
                evvRecordId: evvRecord.id,
                clientId: evvRecord.clientId,
                clientName: evvRecord.clientName,
                workDate,
                clockInTime,
                clockOutTime,
                regularHours: totalHours,
                overtimeHours: 0,
                doubleTimeHours: 0,
                breakHours: 0,
                totalHours,
                payRate: effectiveRate,
                payRateType: isWeekend ? 'WEEKEND' : isHoliday ? 'HOLIDAY' : isNightShift ? 'NIGHT_SHIFT' : 'REGULAR',
                isWeekend,
                isHoliday,
                isNightShift,
                isLiveIn: false,
                appliedMultipliers,
                earnings: totalHours * effectiveRate,
                serviceType: evvRecord.serviceTypeName,
                serviceCode: evvRecord.serviceTypeCode,
                isBillable: true,
                requiresReview: evvRecord.complianceFlags.length > 0,
                reviewReason: evvRecord.complianceFlags.length > 0 ? evvRecord.complianceFlags.join(', ') : undefined,
            };
        });
    }
    calculateHours(timeEntries) {
        const totalHours = timeEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
        let regularHours = totalHours;
        let overtimeHours = 0;
        let doubleTimeHours = 0;
        if (totalHours > 40) {
            overtimeHours = Math.min(totalHours - 40, 8);
            regularHours = 40;
            if (totalHours > 48) {
                doubleTimeHours = totalHours - 48;
                overtimeHours = 8;
            }
        }
        return {
            totalHours,
            regularHours,
            overtimeHours,
            doubleTimeHours,
        };
    }
    calculateEarnings(hoursCalculation, regularRate) {
        const regularEarnings = hoursCalculation.regularHours * regularRate;
        const overtimeEarnings = hoursCalculation.overtimeHours * (regularRate * 1.5);
        const doubleTimeEarnings = hoursCalculation.doubleTimeHours * (regularRate * 2.0);
        const grossEarnings = regularEarnings + overtimeEarnings + doubleTimeEarnings;
        return {
            regularEarnings,
            overtimeEarnings,
            doubleTimeEarnings,
            grossEarnings,
        };
    }
    calculateOvertime(hoursCalculation, regularRate) {
        return hoursCalculation;
    }
    async approvePayRun(payRunId, userId) {
        const payRun = await this.repository.findPayRunById(payRunId);
        if (!payRun) {
            throw new Error('Pay run not found');
        }
        if (payRun.status !== 'CALCULATED' && payRun.status !== 'PENDING_APPROVAL') {
            throw new Error(`Cannot approve pay run in ${payRun.status} status`);
        }
        if (payRun.hasErrors) {
            throw new Error('Cannot approve pay run with errors');
        }
        const statusChange = {
            id: (0, uuid_1.v4)(),
            fromStatus: payRun.status,
            toStatus: 'APPROVED',
            timestamp: new Date(),
            changedBy: userId,
            automatic: false,
            reason: 'Pay run approved for payment processing',
        };
        await this.repository.updatePayRun(payRunId, {
            status: 'APPROVED',
            statusHistory: [...payRun.statusHistory, statusChange],
            approvedAt: new Date(),
            approvedBy: userId,
        });
    }
    async openPayPeriod(payPeriodId, userId) {
        const payPeriod = await this.repository.findPayPeriodById(payPeriodId);
        if (!payPeriod) {
            throw new Error('Pay period not found');
        }
        if (payPeriod.status !== 'DRAFT') {
            throw new Error(`Cannot open pay period in ${payPeriod.status} status`);
        }
        const statusChange = {
            id: (0, uuid_1.v4)(),
            fromStatus: 'DRAFT',
            toStatus: 'OPEN',
            timestamp: new Date(),
            changedBy: userId,
            reason: 'Pay period opened for timesheet submission',
        };
        await this.repository.updatePayPeriod(payPeriodId, {
            status: 'OPEN',
            statusHistory: [...payPeriod.statusHistory, statusChange],
        });
    }
    async lockPayPeriod(payPeriodId, userId) {
        const payPeriod = await this.repository.findPayPeriodById(payPeriodId);
        if (!payPeriod) {
            throw new Error('Pay period not found');
        }
        if (payPeriod.status !== 'OPEN') {
            throw new Error(`Cannot lock pay period in ${payPeriod.status} status`);
        }
        const statusChange = {
            id: (0, uuid_1.v4)(),
            fromStatus: 'OPEN',
            toStatus: 'LOCKED',
            timestamp: new Date(),
            changedBy: userId,
            reason: 'Pay period locked for payroll processing',
        };
        await this.repository.updatePayPeriod(payPeriodId, {
            status: 'LOCKED',
            statusHistory: [...payPeriod.statusHistory, statusChange],
        });
    }
}
exports.PayrollService = PayrollService;
//# sourceMappingURL=payroll-service.js.map