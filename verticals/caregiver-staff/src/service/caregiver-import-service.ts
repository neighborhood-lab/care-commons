/**
 * Caregiver import service
 *
 * Bulk import of caregiver/staff records from CSV/Excel files
 * Supports dry-run preview, validation, and error reporting
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ImportOptions,
  ImportResult,
  ImportError,
  ImportService,
  ParseResult,
  parseCsv,
  Database,
  UserContext,
} from '@folkcare/core';
import {
  Caregiver,
  CreateCaregiverInput,
  CaregiverStatus,
  CaregiverRole,
  EmploymentType,
  EmploymentStatus,
} from '../types/caregiver.js';
import { CaregiverRepository } from '../repository/caregiver-repository.js';
import { CaregiverValidator } from '../validation/caregiver-validator.js';

/**
 * CSV row structure for caregiver import
 */
export interface CaregiverImportRow {
  // Required fields
  first_name: string;
  last_name: string;
  date_of_birth: string;
  primary_branch_id: string;

  // Address fields (primary address required)
  address_line1: string;
  address_city: string;
  address_state: string;
  address_postal_code: string;

  // Required employment fields
  hire_date: string;
  employment_type: string; // FULL_TIME, PART_TIME, PER_DIEM, CONTRACT
  role: string; // CAREGIVER, RN, LVN, AIDE, etc.

  // Optional personal fields
  middle_name?: string;
  preferred_name?: string;
  gender?: string;
  ssn?: string;
  pronouns?: string;

  // Optional address fields
  address_line2?: string;
  address_county?: string;

  // Optional contact fields
  phone_number?: string;
  phone_type?: string;
  phone_can_sms?: string;
  email?: string;
  preferred_contact_method?: string;

  // Optional administrative fields
  employee_number?: string;
  status?: string;
  employment_status?: string; // ACTIVE, ON_LEAVE, TERMINATED

  // Emergency contact (single primary)
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;

  // Optional skills/credentials (pipe-separated lists)
  skills?: string; // e.g., "Medication Administration|Wound Care|Dementia Care"
  specializations?: string; // e.g., "Alzheimers|Parkinsons"

  // Optional pay rate fields (defaults provided if missing)
  pay_rate_amount?: string; // Default: 0 (to be determined)
  pay_rate_unit?: string; // Default: HOURLY
  pay_rate_type?: string; // Default: BASE
}

export class CaregiverImportService implements ImportService<CaregiverImportRow, Caregiver> {
  private repository: CaregiverRepository;
  private validator: CaregiverValidator;

  constructor(database: Database) {
    this.repository = new CaregiverRepository(database);
    this.validator = new CaregiverValidator();
  }

  /**
   * Parse CSV file to caregiver import rows
   */
  async parseFile(fileBuffer: Buffer, fileName: string): Promise<ParseResult<CaregiverImportRow>> {
    const requiredHeaders = [
      'first_name',
      'last_name',
      'date_of_birth',
      'primary_branch_id',
      'address_line1',
      'address_city',
      'address_state',
      'address_postal_code',
      'hire_date',
      'employment_type',
      'role',
    ];

    return parseCsv<CaregiverImportRow>(fileBuffer, fileName, {
      expectedHeaders: requiredHeaders,
      allowExtraColumns: true,
      skipEmptyRows: true,
    });
  }

  /**
   * Validate a single import record
   */
  async validateRecord(record: CaregiverImportRow, rowNumber: number): Promise<ImportError[]> {
    const errors: ImportError[] = [];

    // Validate required fields
    if (!record.first_name?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'first_name',
        message: 'First name is required',
        severity: 'ERROR',
      });
    }

    if (!record.last_name?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'last_name',
        message: 'Last name is required',
        severity: 'ERROR',
      });
    }

    // Validate date of birth
    if (!record.date_of_birth) {
      errors.push({
        row: rowNumber,
        field: 'date_of_birth',
        message: 'Date of birth is required',
        severity: 'ERROR',
      });
    } else {
      const dob = this.parseDate(record.date_of_birth);
      if (!dob) {
        errors.push({
          row: rowNumber,
          field: 'date_of_birth',
          message: 'Invalid date format (use YYYY-MM-DD, MM/DD/YYYY, or ISO 8601)',
          severity: 'ERROR',
        });
      } else {
        // Validate age (16-100 years for caregivers)
        const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (age < 16 || age > 100) {
          errors.push({
            row: rowNumber,
            field: 'date_of_birth',
            message: 'Age must be between 16 and 100 years',
            severity: 'ERROR',
          });
        }
      }
    }

    // Validate hire date
    if (!record.hire_date) {
      errors.push({
        row: rowNumber,
        field: 'hire_date',
        message: 'Hire date is required',
        severity: 'ERROR',
      });
    } else {
      const hireDate = this.parseDate(record.hire_date);
      if (!hireDate) {
        errors.push({
          row: rowNumber,
          field: 'hire_date',
          message: 'Invalid hire date format (use YYYY-MM-DD, MM/DD/YYYY, or ISO 8601)',
          severity: 'ERROR',
        });
      }
    }

    // Validate branch ID (UUID format)
    if (!record.primary_branch_id?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'primary_branch_id',
        message: 'Primary branch ID is required',
        severity: 'ERROR',
      });
    } else if (!this.isValidUuid(record.primary_branch_id)) {
      errors.push({
        row: rowNumber,
        field: 'primary_branch_id',
        message: 'Primary branch ID must be a valid UUID',
        severity: 'ERROR',
      });
    }

    // Validate address
    if (!record.address_line1?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'address_line1',
        message: 'Address line 1 is required',
        severity: 'ERROR',
      });
    }

    if (!record.address_city?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'address_city',
        message: 'City is required',
        severity: 'ERROR',
      });
    }

    if (!record.address_state?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'address_state',
        message: 'State is required',
        severity: 'ERROR',
      });
    } else if (record.address_state.length !== 2) {
      errors.push({
        row: rowNumber,
        field: 'address_state',
        message: 'State must be 2-letter code (e.g., TX, FL)',
        severity: 'ERROR',
      });
    }

    if (!record.address_postal_code?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'address_postal_code',
        message: 'Postal code is required',
        severity: 'ERROR',
      });
    } else if (!/^\d{5}(-\d{4})?$/.test(record.address_postal_code)) {
      errors.push({
        row: rowNumber,
        field: 'address_postal_code',
        message: 'Postal code must be 5 digits or 5+4 format (e.g., 12345 or 12345-6789)',
        severity: 'ERROR',
      });
    }

    // Validate employment type
    if (!record.employment_type?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'employment_type',
        message: 'Employment type is required',
        severity: 'ERROR',
      });
    } else if (!this.isValidEmploymentType(record.employment_type)) {
      errors.push({
        row: rowNumber,
        field: 'employment_type',
        message: 'Employment type must be: FULL_TIME, PART_TIME, PER_DIEM, CONTRACT, TEMPORARY, or SEASONAL',
        severity: 'ERROR',
      });
    }

    // Validate role
    if (!record.role?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'role',
        message: 'Role is required',
        severity: 'ERROR',
      });
    } else if (!this.isValidCaregiverRole(record.role)) {
      errors.push({
        row: rowNumber,
        field: 'role',
        message: 'Role must be: CAREGIVER, RN, LVN_LPN, CNA, HHA, PCA, or COORDINATOR',
        severity: 'ERROR',
      });
    }

    // Validate optional fields
    if (record.gender && !this.isValidGender(record.gender)) {
      errors.push({
        row: rowNumber,
        field: 'gender',
        message: 'Gender must be: MALE, FEMALE, NON_BINARY, OTHER, or PREFER_NOT_TO_SAY',
        severity: 'ERROR',
      });
    }

    if (record.status && !this.isValidCaregiverStatus(record.status)) {
      errors.push({
        row: rowNumber,
        field: 'status',
        message: 'Status must be: ACTIVE, INACTIVE, ON_LEAVE, or TERMINATED',
        severity: 'ERROR',
      });
    }

    if (record.employment_status && !this.isValidEmploymentStatus(record.employment_status)) {
      errors.push({
        row: rowNumber,
        field: 'employment_status',
        message: 'Employment status must be: ACTIVE, ON_LEAVE, TERMINATED, SUSPENDED, or PROBATION',
        severity: 'ERROR',
      });
    }

    if (record.email && !this.isValidEmail(record.email)) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Invalid email format',
        severity: 'ERROR',
      });
    }

    if (record.phone_number && !this.isValidPhone(record.phone_number)) {
      errors.push({
        row: rowNumber,
        field: 'phone_number',
        message: 'Invalid phone number format',
        severity: 'WARNING',
      });
    }

    if (record.preferred_contact_method && !this.isValidContactMethod(record.preferred_contact_method)) {
      errors.push({
        row: rowNumber,
        field: 'preferred_contact_method',
        message: 'Preferred contact method must be: PHONE, EMAIL, SMS, or MAIL',
        severity: 'ERROR',
      });
    }

    // Warn if required fields are missing (we'll provide defaults, but user should know)
    if (!record.phone_number?.trim() && !record.email?.trim()) {
      errors.push({
        row: rowNumber,
        message: 'Neither phone nor email provided - placeholder contact info will be used',
        severity: 'WARNING',
      });
    }

    if (!record.emergency_contact_name?.trim() || !record.emergency_contact_phone?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'emergency_contact',
        message: 'Emergency contact information incomplete - placeholder will be used',
        severity: 'WARNING',
      });
    }

    // Validate pay rate if provided
    if (record.pay_rate_amount && isNaN(parseFloat(record.pay_rate_amount))) {
      errors.push({
        row: rowNumber,
        field: 'pay_rate_amount',
        message: 'Pay rate amount must be a number',
        severity: 'ERROR',
      });
    }

    if (record.pay_rate_unit && !this.isValidPayRateUnit(record.pay_rate_unit)) {
      errors.push({
        row: rowNumber,
        field: 'pay_rate_unit',
        message: 'Pay rate unit must be: HOURLY, VISIT, DAILY, or SALARY',
        severity: 'ERROR',
      });
    }

    return errors;
  }

  /**
   * Import caregivers from parsed records
   */
  async import(records: CaregiverImportRow[], options: ImportOptions): Promise<ImportResult<Caregiver>> {
    const startedAt = new Date();
    const errors: ImportError[] = [];
    const importedIds: string[] = [];
    const preview: Caregiver[] = [];
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // Create user context for operations
    const context: UserContext = {
      userId: options.userId,
      organizationId: options.organizationId,
      permissions: ['caregivers:create', 'caregivers:update'],
      roles: ['ADMIN'],
      branchIds: [],
    };

    // Process records in batches
    const batchSize = options.batchSize || 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      for (let j = 0; j < batch.length; j++) {
        const record = batch[j];
        if (!record) continue; // Skip undefined records

        const rowNumber = i + j + 2; // +2 for header row and 1-based indexing

        // Validate record
        const validationErrors = await this.validateRecord(record, rowNumber);
        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
          const hasErrors = validationErrors.some((e) => e.severity === 'ERROR');
          if (hasErrors) {
            skipped++;
            continue;
          }
        }

        try {
          // Convert CSV row to CreateCaregiverInput
          const caregiverInput = this.mapRowToInput(record, options.organizationId);

          if (options.dryRun) {
            // Dry-run: validate with full schema but don't persist
            const validation = this.validator.validateCreate(caregiverInput);
            if (!validation.success) {
              const validationErrors = validation.errors || [];
              for (const error of validationErrors) {
                errors.push({
                  row: rowNumber,
                  field: error.field,
                  message: error.message,
                  severity: 'ERROR',
                });
              }
              skipped++;
            } else {
              // Add to preview
              const previewCaregiver = this.createPreviewCaregiver(caregiverInput, context);
              preview.push(previewCaregiver);
              imported++;
            }
          } else {
            // Check for duplicate by employee number or name+DOB
            let existingCaregiver: Caregiver | null = null;
            if (record.employee_number) {
              existingCaregiver = await this.repository.findByEmployeeNumber(
                record.employee_number,
                options.organizationId
              );
            }

            if (!existingCaregiver) {
              // Check for duplicate by name and DOB (use search)
              const searchQuery = `${record.first_name.trim()} ${record.last_name.trim()}`;
              const nameMatches = await this.repository.search(
                { query: searchQuery },
                { page: 1, limit: 10 }
              );

              if (nameMatches.items.length > 0) {
                const recordDob = this.parseDate(record.date_of_birth);
                const dobMatch = nameMatches.items.find((c: Caregiver) => {
                  return recordDob && c.dateOfBirth.getTime() === recordDob.getTime();
                });
                if (dobMatch) {
                  existingCaregiver = dobMatch;
                }
              }
            }

            if (existingCaregiver && !options.updateExisting) {
              errors.push({
                row: rowNumber,
                message: `Caregiver already exists: ${existingCaregiver.firstName} ${existingCaregiver.lastName} (ID: ${existingCaregiver.id})`,
                severity: 'WARNING',
                data: record as unknown as Record<string, unknown>,
              });
              skipped++;
            } else if (existingCaregiver && options.updateExisting) {
              // Update existing caregiver
              const updateInput = this.mapRowToUpdateInput(record);
              await this.repository.update(existingCaregiver.id, updateInput, context);
              importedIds.push(existingCaregiver.id);
              updated++;
            } else {
              // Create new caregiver
              const caregiver = await this.repository.create(caregiverInput, context);
              importedIds.push(caregiver.id);
              imported++;
            }
          }
        } catch (error) {
          errors.push({
            row: rowNumber,
            message: `Import failed: ${error instanceof Error ? error.message : String(error)}`,
            severity: 'ERROR',
            data: record as unknown as Record<string, unknown>,
          });
          skipped++;
        }
      }
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    return {
      success: errors.filter((e) => e.severity === 'ERROR').length === 0,
      imported: options.dryRun ? 0 : imported,
      updated: options.dryRun ? 0 : updated,
      skipped,
      total: records.length,
      errors,
      importedIds: options.dryRun ? undefined : importedIds,
      preview: options.dryRun ? preview : undefined,
      metadata: {
        startedAt,
        completedAt,
        durationMs,
        sourceFile: {
          name: 'import.csv',
          size: 0,
          mimeType: 'text/csv',
        },
        options,
      },
    };
  }

  /**
   * Map CSV row to CreateCaregiverInput
   */
  private mapRowToInput(row: CaregiverImportRow, organizationId: string): CreateCaregiverInput {
    // Provide defaults for required fields
    const primaryPhone = row.phone_number?.trim()
      ? {
          number: row.phone_number.trim(),
          type: (row.phone_type?.toUpperCase() === 'MOBILE' || row.phone_type?.toUpperCase() === 'WORK'
            ? row.phone_type.toUpperCase()
            : 'HOME') as 'MOBILE' | 'HOME' | 'WORK',
          canReceiveSMS: row.phone_can_sms?.toLowerCase() === 'true' || row.phone_can_sms?.toLowerCase() === 'yes',
        }
      : {
          number: '+10000000000', // Placeholder - to be updated
          type: 'HOME' as const,
          canReceiveSMS: false,
        };

    const email = row.email?.trim()
      ? row.email.trim().toLowerCase()
      : `placeholder-${uuidv4().substring(0, 8)}@folkcare.example`;

    const emergencyContacts = row.emergency_contact_name?.trim() && row.emergency_contact_phone?.trim()
      ? [
          {
            id: uuidv4(),
            name: row.emergency_contact_name.trim(),
            relationship: row.emergency_contact_relationship?.trim() || 'Emergency Contact',
            phone: {
              number: row.emergency_contact_phone.trim(),
              type: 'HOME' as const,
              canReceiveSMS: false,
            },
            isPrimary: true,
          },
        ]
      : [
          {
            id: uuidv4(),
            name: 'To Be Determined',
            relationship: 'Emergency Contact',
            phone: {
              number: '+10000000000',
              type: 'HOME' as const,
              canReceiveSMS: false,
            },
            isPrimary: true,
          },
        ];

    const payRate = {
      id: uuidv4(),
      rateType: (row.pay_rate_type?.toUpperCase() || 'BASE') as 'BASE' | 'OVERTIME' | 'WEEKEND' | 'HOLIDAY' | 'LIVE_IN' | 'SPECIALIZED_CARE',
      amount: row.pay_rate_amount ? parseFloat(row.pay_rate_amount) : 0,
      unit: (row.pay_rate_unit?.toUpperCase() || 'HOURLY') as 'HOURLY' | 'VISIT' | 'DAILY' | 'SALARY',
      effectiveDate: this.parseDate(row.hire_date)!,
    };

    const input: CreateCaregiverInput = {
      organizationId,
      branchIds: [row.primary_branch_id.trim()],
      primaryBranchId: row.primary_branch_id.trim(),
      firstName: row.first_name.trim(),
      lastName: row.last_name.trim(),
      dateOfBirth: this.parseDate(row.date_of_birth)!,
      primaryPhone,
      email,
      primaryAddress: {
        type: 'HOME',
        line1: row.address_line1.trim(),
        city: row.address_city.trim(),
        state: row.address_state.trim().toUpperCase(),
        postalCode: row.address_postal_code.trim(),
        country: 'US',
      },
      emergencyContacts,
      hireDate: this.parseDate(row.hire_date)!,
      employmentType: row.employment_type.toUpperCase() as EmploymentType,
      role: row.role.toUpperCase().replace(/[^A-Z_]/g, '_') as CaregiverRole,
      payRate,
    };

    // Optional personal fields
    if (row.middle_name?.trim()) input.middleName = row.middle_name.trim();
    if (row.preferred_name?.trim()) input.preferredName = row.preferred_name.trim();

    // Address line 2 and county
    if (row.address_line2?.trim()) input.primaryAddress.line2 = row.address_line2.trim();
    if (row.address_county?.trim()) input.primaryAddress.county = row.address_county.trim();

    // Note: gender, preferredContactMethod, employmentStatus, skills, specializations
    // are not part of CreateCaregiverInput and would need to be updated after creation

    return input;
  }

  /**
   * Map CSV row to update input (for existing caregivers)
   */
  private mapRowToUpdateInput(row: CaregiverImportRow): Partial<Caregiver> {
    const input: Partial<Caregiver> = {};

    // Only update fields that are provided
    if (row.first_name?.trim()) input.firstName = row.first_name.trim();
    if (row.last_name?.trim()) input.lastName = row.last_name.trim();
    if (row.middle_name?.trim()) input.middleName = row.middle_name.trim();
    if (row.preferred_name?.trim()) input.preferredName = row.preferred_name.trim();
    if (row.email?.trim()) input.email = row.email.trim().toLowerCase();
    if (row.status?.trim()) input.status = row.status.toUpperCase() as CaregiverStatus;
    if (row.employment_status?.trim()) input.employmentStatus = row.employment_status.toUpperCase() as EmploymentStatus;

    return input;
  }

  /**
   * Create preview caregiver for dry-run
   */
  private createPreviewCaregiver(input: CreateCaregiverInput, context: UserContext): Caregiver {
    const now = new Date();

    // Default availability (to be configured by coordinator)
    const defaultDayAvailability = { available: false };
    const defaultAvailability = {
      schedule: {
        monday: defaultDayAvailability,
        tuesday: defaultDayAvailability,
        wednesday: defaultDayAvailability,
        thursday: defaultDayAvailability,
        friday: defaultDayAvailability,
        saturday: defaultDayAvailability,
        sunday: defaultDayAvailability,
      },
      lastUpdated: now,
    };

    return {
      id: uuidv4(),
      organizationId: input.organizationId,
      branchIds: input.branchIds,
      primaryBranchId: input.primaryBranchId,
      // eslint-disable-next-line sonarjs/pseudo-random
      employeeNumber: 'PREVIEW-' + Math.random().toString(36).substring(7).toUpperCase(),
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth,
      primaryAddress: input.primaryAddress,
      primaryPhone: input.primaryPhone,
      email: input.email,
      preferredContactMethod: 'EMAIL',
      emergencyContacts: input.emergencyContacts,
      employmentType: input.employmentType,
      employmentStatus: 'ACTIVE',
      hireDate: input.hireDate,
      role: input.role,
      permissions: [],
      credentials: [],
      training: [],
      skills: [],
      specializations: [],
      availability: defaultAvailability,
      payRate: input.payRate,
      complianceStatus: 'PENDING_VERIFICATION',
      preferredClients: [],
      restrictedClients: [],
      status: input.status || 'ACTIVE',
      createdAt: now,
      createdBy: context.userId,
      updatedAt: now,
      updatedBy: context.userId,
      version: 1,
      deletedAt: null,
      deletedBy: null,
      middleName: input.middleName,
      preferredName: input.preferredName,
    };
  }

  /**
   * Parse date from various formats
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Try ISO format (YYYY-MM-DD)
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    // Try MM/DD/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parts[0];
      const day = parts[1];
      const year = parts[2];
      if (month && day && year) {
        date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        if (!isNaN(date.getTime())) return date;
      }
    }

    return null;
  }

  /**
   * Validate UUID format
   */
  private isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate gender value
   */
  private isValidGender(gender: string): boolean {
    const validGenders = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY'];
    return validGenders.includes(gender.toUpperCase());
  }

  /**
   * Validate caregiver status
   */
  private isValidCaregiverStatus(status: string): boolean {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'];
    return validStatuses.includes(status.toUpperCase());
  }

  /**
   * Validate employment type
   */
  private isValidEmploymentType(type: string): boolean {
    const validTypes = ['FULL_TIME', 'PART_TIME', 'PER_DIEM', 'CONTRACT', 'TEMPORARY', 'SEASONAL'];
    return validTypes.includes(type.toUpperCase());
  }

  /**
   * Validate employment status
   */
  private isValidEmploymentStatus(status: string): boolean {
    const validStatuses = ['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'SUSPENDED', 'PROBATION'];
    return validStatuses.includes(status.toUpperCase());
  }

  /**
   * Validate caregiver role
   */
  private isValidCaregiverRole(role: string): boolean {
    const validRoles = ['CAREGIVER', 'RN', 'LVN_LPN', 'CNA', 'HHA', 'PCA', 'COORDINATOR'];
    return validRoles.includes(role.toUpperCase().replace(/[^A-Z_]/g, '_'));
  }

  /**
   * Validate contact method
   */
  private isValidContactMethod(method: string): boolean {
    const validMethods = ['PHONE', 'EMAIL', 'SMS', 'MAIL'];
    return validMethods.includes(method.toUpperCase());
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    // Simple email validation - more complex patterns are vulnerable to ReDoS
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // eslint-disable-line sonarjs/slow-regex
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  private isValidPhone(phone: string): boolean {
    // Allow various phone formats: digits, spaces, dashes, parens, plus
    const phoneRegex = /^[\d\s\-()+ ]+$/; // eslint-disable-line sonarjs/duplicates-in-character-class
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  /**
   * Validate pay rate unit
   */
  private isValidPayRateUnit(unit: string): boolean {
    const validUnits = ['HOURLY', 'VISIT', 'DAILY', 'SALARY'];
    return validUnits.includes(unit.toUpperCase());
  }
}
