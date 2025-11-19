/**
 * Client import service
 * 
 * Bulk import of client records from CSV/Excel files
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
} from '@care-commons/core';
import { Client, CreateClientInput, ClientStatus, Gender } from '../types/client.js';
import { ClientRepository } from '../repository/client-repository.js';
import { ClientValidator } from '../validation/client-validator.js';

/**
 * CSV row structure for client import
 */
export interface ClientImportRow {
  // Required fields
  first_name: string;
  last_name: string;
  date_of_birth: string;
  branch_id: string;
  
  // Address fields (primary address required)
  address_line1: string;
  address_city: string;
  address_state: string;
  address_postal_code: string;
  
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
  client_number?: string;
  status?: string;
  referral_source?: string;
  intake_date?: string;
  
  // Emergency contact (single primary)
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
}

export class ClientImportService implements ImportService<ClientImportRow, Client> {
  private repository: ClientRepository;
  private validator: ClientValidator;

  constructor(database: Database) {
    this.repository = new ClientRepository(database);
    this.validator = new ClientValidator();
  }

  /**
   * Parse CSV file to client import rows
   */
  async parseFile(fileBuffer: Buffer, fileName: string): Promise<ParseResult<ClientImportRow>> {
    const requiredHeaders = [
      'first_name',
      'last_name',
      'date_of_birth',
      'branch_id',
      'address_line1',
      'address_city',
      'address_state',
      'address_postal_code',
    ];

    return parseCsv<ClientImportRow>(fileBuffer, fileName, {
      expectedHeaders: requiredHeaders,
      allowExtraColumns: true,
      skipEmptyRows: true,
    });
  }

  /**
   * Validate a single import record
   */
  async validateRecord(record: ClientImportRow, rowNumber: number): Promise<ImportError[]> {
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
        // Validate age (0-150 years)
        const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (age < 0 || age > 150) {
          errors.push({
            row: rowNumber,
            field: 'date_of_birth',
            message: 'Date of birth must result in age between 0 and 150 years',
            severity: 'ERROR',
          });
        }
      }
    }

    // Validate branch ID (UUID format)
    if (!record.branch_id?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'branch_id',
        message: 'Branch ID is required',
        severity: 'ERROR',
      });
    } else if (!this.isValidUuid(record.branch_id)) {
      errors.push({
        row: rowNumber,
        field: 'branch_id',
        message: 'Branch ID must be a valid UUID',
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

    // Validate optional fields
    if (record.gender && !this.isValidGender(record.gender)) {
      errors.push({
        row: rowNumber,
        field: 'gender',
        message: 'Gender must be: MALE, FEMALE, NON_BINARY, OTHER, or PREFER_NOT_TO_SAY',
        severity: 'ERROR',
      });
    }

    if (record.status && !this.isValidClientStatus(record.status)) {
      errors.push({
        row: rowNumber,
        field: 'status',
        message: 'Status must be: INQUIRY, PENDING_INTAKE, ACTIVE, INACTIVE, ON_HOLD, DISCHARGED, or DECEASED',
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

    return errors;
  }

  /**
   * Import clients from parsed records
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async import(records: ClientImportRow[], options: ImportOptions): Promise<ImportResult<Client>> {
    const startedAt = new Date();
    const errors: ImportError[] = [];
    const importedIds: string[] = [];
    const preview: Client[] = [];
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // Create user context for operations
    const context: UserContext = {
      userId: options.userId,
      organizationId: options.organizationId,
      permissions: ['clients:create', 'clients:update'],
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
          // Convert CSV row to CreateClientInput
          const clientInput = this.mapRowToInput(record, options.organizationId);

          if (options.dryRun) {
            // Dry-run: validate with full schema but don't persist
            const validation = this.validator.validateCreate(clientInput);
            if (!validation.success) {
              const validationErrors = validation.errors || [];
              for (const error of validationErrors) {
                errors.push({
                  row: rowNumber,
                  field: Array.isArray(error.path) ? error.path.join('.') : error.path,
                  message: error.message,
                  severity: 'ERROR',
                });
              }
              skipped++;
            } else {
              // Add to preview
              const previewClient = this.createPreviewClient(clientInput, context);
              preview.push(previewClient);
              imported++;
            }
          } else {
            // Check for duplicate by client number or name+DOB
            let existingClient: Client | null = null;
            if (record.client_number) {
              existingClient = await this.repository.findByClientNumber(
                record.client_number,
                options.organizationId
              );
            }

            if (!existingClient) {
              // Check for duplicate by name and DOB (use query search)
              const searchQuery = `${record.first_name.trim()} ${record.last_name.trim()}`;
              const nameMatches = await this.repository.search(
                { query: searchQuery },
                { page: 1, limit: 10 }
              );

              if (nameMatches.items.length > 0) {
                const dobMatch = nameMatches.items.find((c: Client) => {
                  const recordDob = this.parseDate(record.date_of_birth);
                  return recordDob && c.dateOfBirth.getTime() === recordDob.getTime();
                });
                if (dobMatch) {
                  existingClient = dobMatch;
                }
              }
            }

            if (existingClient && !options.updateExisting) {
              errors.push({
                row: rowNumber,
                message: `Client already exists: ${existingClient.firstName} ${existingClient.lastName} (ID: ${existingClient.id})`,
                severity: 'WARNING',
                data: record as unknown as Record<string, unknown>,
              });
              skipped++;
            } else if (existingClient && options.updateExisting) {
              // Update existing client
              const updateInput = this.mapRowToUpdateInput(record);
              await this.repository.update(existingClient.id, updateInput, context);
              importedIds.push(existingClient.id);
              updated++;
            } else {
              // Create new client
              const client = await this.repository.create(clientInput, context);
              importedIds.push(client.id);
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
   * Map CSV row to CreateClientInput
   */
  private mapRowToInput(row: ClientImportRow, organizationId: string): CreateClientInput {
    const input: CreateClientInput = {
      organizationId,
      branchId: row.branch_id.trim(),
      firstName: row.first_name.trim(),
      lastName: row.last_name.trim(),
      dateOfBirth: this.parseDate(row.date_of_birth)!,
      primaryAddress: {
        type: 'HOME',
        line1: row.address_line1.trim(),
        city: row.address_city.trim(),
        state: row.address_state.trim().toUpperCase(),
        postalCode: row.address_postal_code.trim(),
        country: 'US',
      },
    };

    // Optional personal fields
    if (row.middle_name?.trim()) input.middleName = row.middle_name.trim();
    if (row.preferred_name?.trim()) input.preferredName = row.preferred_name.trim();
    if (row.gender?.trim()) input.gender = row.gender.toUpperCase() as Gender;

    // Address line 2 and county
    if (row.address_line2?.trim()) input.primaryAddress.line2 = row.address_line2.trim();
    if (row.address_county?.trim()) input.primaryAddress.county = row.address_county.trim();

    // Phone
    if (row.phone_number?.trim()) {
      input.primaryPhone = {
        number: row.phone_number.trim(),
        type: row.phone_type?.toUpperCase() === 'MOBILE' || row.phone_type?.toUpperCase() === 'WORK' 
          ? row.phone_type.toUpperCase() as 'MOBILE' | 'WORK' 
          : 'HOME',
        canReceiveSMS: row.phone_can_sms?.toLowerCase() === 'true' || row.phone_can_sms?.toLowerCase() === 'yes',
      };
    }

    // Email
    if (row.email?.trim()) input.email = row.email.trim().toLowerCase();

    // Note: preferredContactMethod not supported in CreateClientInput

    // Administrative fields
    if (row.status?.trim()) input.status = row.status.toUpperCase() as ClientStatus;
    if (row.referral_source?.trim()) input.referralSource = row.referral_source.trim();
    if (row.intake_date?.trim()) {
      const intakeDate = this.parseDate(row.intake_date);
      if (intakeDate) input.intakeDate = intakeDate;
    }

    // Emergency contact
    if (row.emergency_contact_name?.trim() && row.emergency_contact_relationship?.trim() && row.emergency_contact_phone?.trim()) {
      input.emergencyContacts = [
        {
          id: uuidv4(),
          name: row.emergency_contact_name.trim(),
          relationship: row.emergency_contact_relationship.trim(),
          phone: {
            number: row.emergency_contact_phone.trim(),
            type: 'HOME',
            canReceiveSMS: false,
          },
          isPrimary: true,
          canMakeHealthcareDecisions: false,
        },
      ];
    }

    return input;
  }

  /**
   * Map CSV row to update input (for existing clients)
   */
  private mapRowToUpdateInput(row: ClientImportRow): Partial<Client> {
    const input: Partial<Client> = {};

    // Only update fields that are provided
    if (row.first_name?.trim()) input.firstName = row.first_name.trim();
    if (row.last_name?.trim()) input.lastName = row.last_name.trim();
    if (row.middle_name?.trim()) input.middleName = row.middle_name.trim();
    if (row.preferred_name?.trim()) input.preferredName = row.preferred_name.trim();
    if (row.email?.trim()) input.email = row.email.trim().toLowerCase();
    if (row.status?.trim()) input.status = row.status.toUpperCase() as ClientStatus;

    return input;
  }

  /**
   * Create preview client for dry-run
   */
  private createPreviewClient(input: CreateClientInput, context: UserContext): Client {
    const now = new Date();
    return {
      id: uuidv4(),
      organizationId: input.organizationId,
      branchId: input.branchId,
      clientNumber: 'PREVIEW-' + Math.random().toString(36).substring(7).toUpperCase(),
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth,
      primaryAddress: input.primaryAddress,
      emergencyContacts: input.emergencyContacts || [],
      authorizedContacts: [],
      programs: [],
      serviceEligibility: {
        medicaidEligible: false,
        medicareEligible: false,
        veteransBenefits: false,
        longTermCareInsurance: false,
        privatePayOnly: false,
      },
      riskFlags: [],
      status: input.status || 'INQUIRY',
      createdAt: now,
      createdBy: context.userId,
      updatedAt: now,
      updatedBy: context.userId,
      version: 1,
      deletedAt: null,
      deletedBy: null,
      middleName: input.middleName,
      preferredName: input.preferredName,
      gender: input.gender,
      primaryPhone: input.primaryPhone,
      email: input.email,
      referralSource: input.referralSource,
      intakeDate: input.intakeDate,
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
   * Validate client status
   */
  private isValidClientStatus(status: string): boolean {
    const validStatuses = ['INQUIRY', 'PENDING_INTAKE', 'ACTIVE', 'INACTIVE', 'ON_HOLD', 'DISCHARGED', 'DECEASED'];
    return validStatuses.includes(status.toUpperCase());
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
}
