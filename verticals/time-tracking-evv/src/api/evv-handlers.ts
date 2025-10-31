/**
 * EVV API Handlers - HTTP request handlers for EVV operations
 * 
 * Provides RESTful API endpoints for:
 * - Clock-in / Clock-out
 * - Manual overrides
 * - EVV record retrieval
 * - Compliance reporting
 */

import { UserContext } from '@care-commons/core';
import { EVVService } from '../service/evv-service';
import {
  ClockInInput,
  ClockOutInput,
  ManualOverrideInput,
  EVVRecordSearchFilters,
  EVVRecord,
  VerificationLevel,
  ComplianceFlag,
  EVVRecordStatus,
  PayorApprovalStatus,
} from '../types/evv';

export interface APIRequest<T = unknown> {
  body: T;
  params: Record<string, string>;
  query: Record<string, string>;
  user: UserContext;
}

export interface APIResponse {
  status: number;
  data?: unknown;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export class EVVHandlers {
  constructor(private evvService: EVVService) {}

  /**
   * POST /api/evv/clock-in
   * Clock in to start a visit
   */
  async clockIn(req: APIRequest<ClockInInput>): Promise<APIResponse> {
    try {
      const input = req.body;
      const result = await this.evvService.clockIn(input, req.user);

      return {
        status: 201,
        data: {
          success: true,
          evvRecordId: result.evvRecord.id,
          timeEntryId: result.timeEntry.id,
          verification: {
            passed: result.verification.passed,
            verificationLevel: result.verification.verificationLevel,
            complianceFlags: result.verification.complianceFlags,
            requiresSupervisorReview: result.verification.requiresSupervisorReview,
            issues: result.verification.issues,
          },
          clockInTime: result.evvRecord.clockInTime,
          location: {
            isWithinGeofence: result.evvRecord.clockInVerification.isWithinGeofence,
            distanceFromAddress: result.evvRecord.clockInVerification.distanceFromAddress,
            accuracy: result.evvRecord.clockInVerification.accuracy,
          },
        },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/evv/clock-out
   * Clock out to end a visit
   */
  async clockOut(req: APIRequest<ClockOutInput>): Promise<APIResponse> {
    try {
      const input = req.body;
      const result = await this.evvService.clockOut(input, req.user);

      return {
        status: 200,
        data: {
          success: true,
          evvRecordId: result.evvRecord.id,
          timeEntryId: result.timeEntry.id,
          verification: {
            passed: result.verification.passed,
            verificationLevel: result.verification.verificationLevel,
            complianceFlags: result.verification.complianceFlags,
            requiresSupervisorReview: result.verification.requiresSupervisorReview,
            issues: result.verification.issues,
          },
          clockOutTime: result.evvRecord.clockOutTime,
          totalDuration: result.evvRecord.totalDuration,
          billableHours: result.evvRecord.totalDuration 
            ? (result.evvRecord.totalDuration / 60).toFixed(2) 
            : null,
          location: {
            isWithinGeofence: result.evvRecord.clockOutVerification?.isWithinGeofence,
            distanceFromAddress: result.evvRecord.clockOutVerification?.distanceFromAddress,
            accuracy: result.evvRecord.clockOutVerification?.accuracy,
          },
        },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/evv/manual-override
   * Apply manual override to flagged time entry (supervisor only)
   */
  async applyManualOverride(req: APIRequest<ManualOverrideInput>): Promise<APIResponse> {
    try {
      const input = req.body;
      const result = await this.evvService.applyManualOverride(input, req.user);

      return {
        status: 200,
        data: {
          success: true,
          timeEntryId: result.id,
          status: result.status,
          verificationPassed: result.verificationPassed,
          manualOverride: result.manualOverride,
        },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/evv/records/:visitId
   * Get EVV record for a specific visit
   */
  async getEVVRecord(req: APIRequest): Promise<APIResponse> {
    try {
      const { visitId } = req.params;
      const evvRecord = await this.evvService.getEVVRecordByVisit(visitId, req.user);

      if (!evvRecord) {
        return {
          status: 404,
          error: {
            message: 'EVV record not found for this visit',
            code: 'EVV_RECORD_NOT_FOUND',
          },
        };
      }

      return {
        status: 200,
        data: {
          ...evvRecord,
          // Add computed fields for UI
          durationHours: evvRecord.totalDuration 
            ? (evvRecord.totalDuration / 60).toFixed(2) 
            : null,
          isCompliant: evvRecord.complianceFlags.includes('COMPLIANT'),
          hasIssues: evvRecord.complianceFlags.some(
            flag => flag !== 'COMPLIANT'
          ),
        },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/evv/records/:visitId/time-entries
   * Get all time entries for a visit
   */
  async getTimeEntries(req: APIRequest): Promise<APIResponse> {
    try {
      const { visitId } = req.params;
      const timeEntries = await this.evvService.getTimeEntriesByVisit(visitId, req.user);

      return {
        status: 200,
        data: {
          visitId,
          count: timeEntries.length,
          entries: timeEntries.map(entry => ({
            id: entry.id,
            entryType: entry.entryType,
            entryTimestamp: entry.entryTimestamp,
            status: entry.status,
            verificationPassed: entry.verificationPassed,
            location: {
              latitude: entry.location.latitude,
              longitude: entry.location.longitude,
              accuracy: entry.location.accuracy,
              isWithinGeofence: entry.location.isWithinGeofence,
              distanceFromAddress: entry.location.distanceFromAddress,
            },
            deviceInfo: {
              deviceId: entry.deviceInfo.deviceId,
              deviceModel: entry.deviceInfo.deviceModel,
              deviceOS: entry.deviceInfo.deviceOS,
            },
            offlineRecorded: entry.offlineRecorded,
            verificationIssues: entry.verificationIssues,
            manualOverride: entry.manualOverride,
          })),
        },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/evv/records
   * Search EVV records with filters
   */
  async searchEVVRecords(req: APIRequest): Promise<APIResponse> {
    try {
      const filters: EVVRecordSearchFilters = {
        organizationId: req.query.organizationId,
        branchId: req.query.branchId,
        clientId: req.query.clientId,
        caregiverId: req.query.caregiverId,
        visitId: req.query.visitId,
        startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
        status: req.query.status ? [req.query.status as EVVRecordStatus] : undefined,
        verificationLevel: req.query.verificationLevel 
          ? [req.query.verificationLevel as VerificationLevel] 
          : undefined,
        hasComplianceFlags: req.query.hasComplianceFlags === 'true',
        complianceFlags: req.query.complianceFlags 
          ? (req.query.complianceFlags as string).split(',') as ComplianceFlag[]
          : undefined,
        submittedToPayor: req.query.submittedToPayor 
          ? req.query.submittedToPayor === 'true' 
          : undefined,
        payorApprovalStatus: req.query.payorApprovalStatus 
          ? [req.query.payorApprovalStatus as PayorApprovalStatus] 
          : undefined,
      };

      const pagination = {
        page: parseInt(req.query.page || '1'),
        limit: parseInt(req.query.limit || '25'),
        sortBy: req.query.sortBy || 'serviceDate',
        sortOrder: (req.query.sortOrder || 'desc') as 'asc' | 'desc',
      };

      const result = await this.evvService.searchEVVRecords(filters, pagination, req.user);

      return {
        status: 200,
        data: {
          items: result.items.map((record: EVVRecord) => ({
            id: record.id,
            visitId: record.visitId,
            clientName: record.clientName,
            caregiverName: record.caregiverName,
            serviceDate: record.serviceDate,
            clockInTime: record.clockInTime,
            clockOutTime: record.clockOutTime,
            totalDuration: record.totalDuration,
            durationHours: record.totalDuration 
              ? (record.totalDuration / 60).toFixed(2) 
              : null,
            recordStatus: record.recordStatus,
            verificationLevel: record.verificationLevel,
            complianceFlags: record.complianceFlags,
            isCompliant: record.complianceFlags.includes('COMPLIANT'),
            hasIssues: record.complianceFlags.some(
              (flag: ComplianceFlag) => flag !== 'COMPLIANT'
            ),
            submittedToPayor: record.submittedToPayor,
            payorApprovalStatus: record.payorApprovalStatus,
          })),
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
          },
        },
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/evv/compliance-summary
   * Get compliance summary statistics
   */
  async getComplianceSummary(req: APIRequest): Promise<APIResponse> {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return {
          status: 400,
          error: {
            message: 'organizationId, startDate, and endDate are required',
            code: 'MISSING_REQUIRED_PARAMETERS',
          },
        };
      }

      const filters: EVVRecordSearchFilters = {
        organizationId: organizationId as string,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const allRecords = await this.evvService.searchEVVRecords(filters, {
        page: 1,
        limit: 10000, // Get all records for summary
        sortBy: 'serviceDate',
        sortOrder: 'desc',
      }, req.user);

      const summary = {
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
        totalVisits: allRecords.total,
        compliantVisits: 0,
        partiallyCompliantVisits: 0,
        nonCompliantVisits: 0,
        pendingVisits: 0,
        complianceRate: 0,
        verificationLevels: {
          FULL: 0,
          PARTIAL: 0,
          MANUAL: 0,
          PHONE: 0,
          EXCEPTION: 0,
        },
        complianceFlags: {
          COMPLIANT: 0,
          GEOFENCE_VIOLATION: 0,
          TIME_GAP: 0,
          DEVICE_SUSPICIOUS: 0,
          LOCATION_SUSPICIOUS: 0,
          DUPLICATE_ENTRY: 0,
          MISSING_SIGNATURE: 0,
          LATE_SUBMISSION: 0,
          MANUAL_OVERRIDE: 0,
          AMENDED: 0,
        },
        payorSubmission: {
          submitted: 0,
          pending: 0,
          approved: 0,
          denied: 0,
        },
      };

      // Calculate statistics
      for (const record of allRecords.items) {
        // Verification levels
        summary.verificationLevels[record.verificationLevel as VerificationLevel]++;

        // Compliance status
        if (record.recordStatus === 'PENDING') {
          summary.pendingVisits++;
        } else if (record.complianceFlags.includes('COMPLIANT') && 
                   record.complianceFlags.length === 1) {
          summary.compliantVisits++;
        } else if (record.complianceFlags.includes('COMPLIANT')) {
          summary.partiallyCompliantVisits++;
        } else {
          summary.nonCompliantVisits++;
        }

        // Compliance flags
        for (const flag of record.complianceFlags) {
          if (flag in summary.complianceFlags) {
            summary.complianceFlags[flag as keyof typeof summary.complianceFlags]++;
          }
        }

        // Payor submission
        if (record.submittedToPayor) {
          summary.payorSubmission.submitted++;
          if (record.payorApprovalStatus === 'APPROVED') {
            summary.payorSubmission.approved++;
          } else if (record.payorApprovalStatus === 'DENIED') {
            summary.payorSubmission.denied++;
          }
        } else if (record.recordStatus === 'COMPLETE') {
          summary.payorSubmission.pending++;
        }
      }

      // Calculate compliance rate
      const completedVisits = summary.compliantVisits + 
        summary.partiallyCompliantVisits + 
        summary.nonCompliantVisits;
      
      if (completedVisits > 0) {
        summary.complianceRate = 
          (summary.compliantVisits / completedVisits) * 100;
      }

      return {
        status: 200,
        data: summary,
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * Error handler
   */
  private handleError(error: unknown): APIResponse {
    console.error('EVV API Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error && error.name ? error.name : 'UnknownError';

    if (errorName === 'PermissionError') {
      return {
        status: 403,
        error: {
          message: errorMessage,
          code: 'PERMISSION_DENIED',
        },
      };
    }

    if (errorName === 'NotFoundError') {
      return {
        status: 404,
        error: {
          message: errorMessage,
          code: 'NOT_FOUND',
        },
      };
    }

    if (errorName === 'ValidationError') {
      const validationError = error as { details?: unknown };
      return {
        status: 400,
        error: {
          message: errorMessage,
          code: 'VALIDATION_ERROR',
          details: validationError.details,
        },
      };
    }

    return {
      status: 500,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    };
  }
}
