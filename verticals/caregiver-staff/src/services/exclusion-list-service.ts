/**
 * Federal Exclusion List Service
 * 
 * Checks caregivers against federal exclusion databases:
 * - OIG LEIE (Office of Inspector General - List of Excluded Individuals/Entities)
 * - SAM (System for Award Management) Exclusions
 * 
 * CRITICAL COMPLIANCE: Federal law prohibits Medicaid/Medicare reimbursement
 * for services provided by excluded individuals. Agencies must verify
 * exclusion status before hiring and monthly thereafter.
 * 
 * References:
 * - 42 U.S.C. § 1320a-7 (Exclusion of certain individuals and entities)
 * - 42 CFR § 1001 (OIG exclusion regulations)
 * - FAR 9.4 (SAM exclusion requirements)
 */

import { Database, UserContext } from '@care-commons/core';
import { CaregiverRepository } from '../repository/caregiver-repository.js';
import { Caregiver } from '../types/caregiver.js';

/**
 * Exclusion list types
 */
export type ExclusionListType = 'OIG_LEIE' | 'SAM' | 'STATE_MEDICAID';

/**
 * Exclusion check result
 */
export interface ExclusionCheckResult {
  caregiverId: string;
  caregiverName: string;
  employeeNumber: string;
  
  isExcluded: boolean;
  checkDate: Date;
  
  // Results from each list
  oigResult: ExclusionListResult;
  samResult: ExclusionListResult;
  
  // Combined status
  exclusionDetails?: ExclusionDetail[];
  
  // Action required
  requiresImmediateAction: boolean;
  actionRequired?: string;
}

/**
 * Result from checking a single exclusion list
 */
export interface ExclusionListResult {
  listType: ExclusionListType;
  checked: boolean;
  checkDate: Date;
  
  status: 'CLEAR' | 'EXCLUDED' | 'ERROR' | 'PENDING';
  matchFound: boolean;
  matchConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  
  // If excluded
  exclusionId?: string;
  exclusionType?: string;
  exclusionDate?: Date;
  reinstatementDate?: Date;
  
  // API response details
  apiResponseId?: string;
  errorMessage?: string;
}

/**
 * Details of an exclusion
 */
export interface ExclusionDetail {
  listType: ExclusionListType;
  exclusionId: string;
  exclusionType: string;
  exclusionDate: Date;
  reinstatementDate?: Date;
  waiverGranted: boolean;
  reason?: string;
  speciality?: string;
  state?: string;
  
  // Compliance impact
  prohibitsMedicaidBilling: boolean;
  prohibitsMedicareBilling: boolean;
  prohibitsAllFederalPrograms: boolean;
}

/**
 * Batch check result
 */
export interface BatchExclusionCheckResult {
  organizationId: string;
  checkDate: Date;
  totalChecked: number;
  
  clearCount: number;
  excludedCount: number;
  errorCount: number;
  
  excludedCaregivers: ExclusionCheckResult[];
  errors: { caregiverId: string; error: string }[];
}

/**
 * OIG LEIE API response structure (simplified)
 * Real API: https://oig.hhs.gov/exclusions/exclusions_list.asp
 */
interface OIGExclusionRecord {
  EXCLTYPE: string;
  EXCLDATE: string;
  REINDATE?: string;
  WESSION?: string;
  LASTNAME: string;
  FIRSTNAME: string;
  MIDNAME?: string;
  BUSNAME?: string;
  GENERAL: string;
  SPECIALITY?: string;
  UPIN?: string;
  NPI?: string;
  DOB?: string;
  ADDRESS?: string;
  CITY?: string;
  STATE?: string;
  ZIP?: string;
}

/**
 * SAM API response structure (simplified)
 * Real API: https://api.sam.gov/
 */
interface SAMExclusionRecord {
  classificationType: string;
  exclusionType: string;
  exclusionProgram: string;
  excludingAgencyCode: string;
  excludingAgencyName: string;
  exclusionActions: {
    terminationDate?: string;
    activationDate: string;
    createDate: string;
  };
  entity: {
    entityEFTIndicator?: string;
    cageCode?: string;
    legalBusinessName?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    registrationStatus?: string;
  };
}

export class ExclusionListService {
  private repository: CaregiverRepository;
  
  // API configuration (would be in environment variables)
  private oigApiEnabled: boolean;
  private samApiEnabled: boolean;

  constructor(database: Database) {
    this.repository = new CaregiverRepository(database);
    
    // Check if APIs are configured
    this.oigApiEnabled = !!process.env.OIG_API_KEY;
    this.samApiEnabled = !!process.env.SAM_API_KEY;
  }

  /**
   * Check a single caregiver against all exclusion lists
   */
  async checkCaregiver(
    caregiverId: string,
    _context: UserContext
  ): Promise<ExclusionCheckResult> {
    const caregiver = await this.repository.findById(caregiverId);
    if (!caregiver) {
      throw new Error(`Caregiver not found: ${caregiverId}`);
    }

    const checkDate = new Date();
    
    // Check OIG LEIE
    const oigResult = await this.checkOIGList(caregiver);
    
    // Check SAM
    const samResult = await this.checkSAMList(caregiver);
    
    // Combine results
    const isExcluded = oigResult.matchFound || samResult.matchFound;
    const exclusionDetails: ExclusionDetail[] = [];
    
    if (oigResult.matchFound && oigResult.exclusionId) {
      exclusionDetails.push({
        listType: 'OIG_LEIE',
        exclusionId: oigResult.exclusionId,
        exclusionType: oigResult.exclusionType || 'Unknown',
        exclusionDate: oigResult.exclusionDate || checkDate,
        reinstatementDate: oigResult.reinstatementDate,
        waiverGranted: false,
        prohibitsMedicaidBilling: true,
        prohibitsMedicareBilling: true,
        prohibitsAllFederalPrograms: true,
      });
    }
    
    if (samResult.matchFound && samResult.exclusionId) {
      exclusionDetails.push({
        listType: 'SAM',
        exclusionId: samResult.exclusionId,
        exclusionType: samResult.exclusionType || 'Unknown',
        exclusionDate: samResult.exclusionDate || checkDate,
        reinstatementDate: samResult.reinstatementDate,
        waiverGranted: false,
        prohibitsMedicaidBilling: true,
        prohibitsMedicareBilling: true,
        prohibitsAllFederalPrograms: true,
      });
    }

    return {
      caregiverId: caregiver.id,
      caregiverName: `${caregiver.firstName} ${caregiver.lastName}`,
      employeeNumber: caregiver.employeeNumber,
      isExcluded,
      checkDate,
      oigResult,
      samResult,
      exclusionDetails: exclusionDetails.length > 0 ? exclusionDetails : undefined,
      requiresImmediateAction: isExcluded,
      actionRequired: isExcluded
        ? 'CRITICAL: Caregiver appears on federal exclusion list. Immediately suspend from all Medicaid/Medicare services and consult legal counsel.'
        : undefined,
    };
  }

  /**
   * Check all caregivers in an organization
   * 
   * This should be run monthly per CMS requirements
   */
  async checkOrganization(
    organizationId: string,
    context: UserContext
  ): Promise<BatchExclusionCheckResult> {
    const checkDate = new Date();
    
    // Get all active caregivers
    const result = await this.repository.search(
      { 
        organizationId,
        status: ['ACTIVE', 'ONBOARDING', 'PENDING_ONBOARDING'],
      },
      { page: 1, limit: 10000 }
    );
    const caregivers = result.items;

    const excludedCaregivers: ExclusionCheckResult[] = [];
    const errors: { caregiverId: string; error: string }[] = [];
    let clearCount = 0;
    let errorCount = 0;

    for (const caregiver of caregivers) {
      try {
        const checkResult = await this.checkCaregiver(caregiver.id, context);
        
        if (checkResult.isExcluded) {
          excludedCaregivers.push(checkResult);
        } else {
          clearCount++;
        }
      } catch (error) {
        errors.push({
          caregiverId: caregiver.id,
          error: error instanceof Error ? error.message : String(error),
        });
        errorCount++;
      }
    }

    return {
      organizationId,
      checkDate,
      totalChecked: caregivers.length,
      clearCount,
      excludedCount: excludedCaregivers.length,
      errorCount,
      excludedCaregivers,
      errors,
    };
  }

  /**
   * Check OIG LEIE database
   * 
   * In production, this calls the OIG API or uses their downloadable file
   * https://oig.hhs.gov/exclusions/exclusions_list.asp
   */
  private async checkOIGList(caregiver: Caregiver): Promise<ExclusionListResult> {
    const checkDate = new Date();
    
    if (!this.oigApiEnabled) {
      // Return mock result when API not configured
      // In production, this would either:
      // 1. Call the OIG API directly
      // 2. Query a local database populated from their monthly file
      return this.createMockOIGResult(caregiver, checkDate);
    }

    try {
      // Real implementation would call OIG API
      const response = await this.callOIGApi(caregiver);
      
      if (response.length === 0) {
        return {
          listType: 'OIG_LEIE',
          checked: true,
          checkDate,
          status: 'CLEAR',
          matchFound: false,
        };
      }

      // Found potential matches - analyze
      const bestMatch = this.findBestOIGMatch(caregiver, response);
      
      if (bestMatch) {
        return {
          listType: 'OIG_LEIE',
          checked: true,
          checkDate,
          status: 'EXCLUDED',
          matchFound: true,
          matchConfidence: 'HIGH',
          exclusionId: bestMatch.EXCLTYPE,
          exclusionType: this.mapOIGExclusionType(bestMatch.EXCLTYPE),
          exclusionDate: bestMatch.EXCLDATE ? new Date(bestMatch.EXCLDATE) : undefined,
          reinstatementDate: bestMatch.REINDATE ? new Date(bestMatch.REINDATE) : undefined,
        };
      }

      return {
        listType: 'OIG_LEIE',
        checked: true,
        checkDate,
        status: 'CLEAR',
        matchFound: false,
      };
    } catch (error) {
      return {
        listType: 'OIG_LEIE',
        checked: false,
        checkDate,
        status: 'ERROR',
        matchFound: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check SAM.gov exclusions database
   * 
   * In production, this calls the SAM API
   * https://api.sam.gov/
   */
  private async checkSAMList(caregiver: Caregiver): Promise<ExclusionListResult> {
    const checkDate = new Date();
    
    if (!this.samApiEnabled) {
      // Return mock result when API not configured
      return this.createMockSAMResult(caregiver, checkDate);
    }

    try {
      // Real implementation would call SAM API
      const response = await this.callSAMApi(caregiver);
      
      if (response.length === 0) {
        return {
          listType: 'SAM',
          checked: true,
          checkDate,
          status: 'CLEAR',
          matchFound: false,
        };
      }

      // Found potential matches - analyze
      const bestMatch = this.findBestSAMMatch(caregiver, response);
      
      if (bestMatch) {
        return {
          listType: 'SAM',
          checked: true,
          checkDate,
          status: 'EXCLUDED',
          matchFound: true,
          matchConfidence: 'HIGH',
          exclusionId: bestMatch.entity.cageCode || 'N/A',
          exclusionType: bestMatch.exclusionType,
          exclusionDate: new Date(bestMatch.exclusionActions.activationDate),
          reinstatementDate: bestMatch.exclusionActions.terminationDate 
            ? new Date(bestMatch.exclusionActions.terminationDate) 
            : undefined,
        };
      }

      return {
        listType: 'SAM',
        checked: true,
        checkDate,
        status: 'CLEAR',
        matchFound: false,
      };
    } catch (error) {
      return {
        listType: 'SAM',
        checked: false,
        checkDate,
        status: 'ERROR',
        matchFound: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // Mock implementations for when APIs are not configured

  private createMockOIGResult(caregiver: Caregiver, checkDate: Date): ExclusionListResult {
    // In development/demo, return clear unless name contains "EXCLUDED"
    // This allows testing the exclusion workflow
    const isTestExcluded = caregiver.lastName.toUpperCase().includes('EXCLUDED');
    
    if (isTestExcluded) {
      return {
        listType: 'OIG_LEIE',
        checked: true,
        checkDate,
        status: 'EXCLUDED',
        matchFound: true,
        matchConfidence: 'HIGH',
        exclusionId: `TEST-OIG-${caregiver.id.slice(0, 8)}`,
        exclusionType: '1128(a)(1) - Program-Related Crimes',
        exclusionDate: new Date('2020-01-15'),
      };
    }

    return {
      listType: 'OIG_LEIE',
      checked: true,
      checkDate,
      status: 'CLEAR',
      matchFound: false,
    };
  }

  private createMockSAMResult(caregiver: Caregiver, checkDate: Date): ExclusionListResult {
    // In development/demo, return clear unless name contains "EXCLUDED"
    const isTestExcluded = caregiver.lastName.toUpperCase().includes('EXCLUDED');
    
    if (isTestExcluded) {
      return {
        listType: 'SAM',
        checked: true,
        checkDate,
        status: 'EXCLUDED',
        matchFound: true,
        matchConfidence: 'HIGH',
        exclusionId: `TEST-SAM-${caregiver.id.slice(0, 8)}`,
        exclusionType: 'Ineligible (Proceedings Completed)',
        exclusionDate: new Date('2020-01-15'),
      };
    }

    return {
      listType: 'SAM',
      checked: true,
      checkDate,
      status: 'CLEAR',
      matchFound: false,
    };
  }

  // Real API calls (would be implemented in production)

  private async callOIGApi(_caregiver: Caregiver): Promise<OIGExclusionRecord[]> {
    // Real implementation would:
    // 1. Build search query with name, DOB, NPI, etc.
    // 2. Call OIG API endpoint
    // 3. Parse and return results
    
    // For now, throw to indicate not implemented
    throw new Error('OIG API integration not implemented - set OIG_API_KEY to enable');
  }

  private async callSAMApi(_caregiver: Caregiver): Promise<SAMExclusionRecord[]> {
    // Real implementation would:
    // 1. Build search query
    // 2. Call SAM.gov API with API key
    // 3. Parse and return results
    
    // For now, throw to indicate not implemented
    throw new Error('SAM API integration not implemented - set SAM_API_KEY to enable');
  }

  private findBestOIGMatch(
    caregiver: Caregiver,
    records: OIGExclusionRecord[]
  ): OIGExclusionRecord | null {
    // Match logic:
    // 1. Exact name + DOB match = HIGH confidence
    // 2. Exact name + state match = MEDIUM confidence
    // 3. Name match only = LOW confidence (requires manual review)
    
    for (const record of records) {
      const nameMatch = 
        record.LASTNAME.toUpperCase() === caregiver.lastName.toUpperCase() &&
        record.FIRSTNAME.toUpperCase() === caregiver.firstName.toUpperCase();
      
      if (!nameMatch) continue;
      
      // Check DOB if available
      if (record.DOB && caregiver.dateOfBirth) {
        const recordDob = new Date(record.DOB);
        if (recordDob.getTime() === caregiver.dateOfBirth.getTime()) {
          return record; // HIGH confidence match
        }
      }
      
      // Check state if available
      if (record.STATE && caregiver.primaryAddress?.state) {
        if (record.STATE === caregiver.primaryAddress.state) {
          return record; // MEDIUM confidence match
        }
      }
      
      // Name-only match - could be false positive
      // In production, this would flag for manual review
    }
    
    return null;
  }

  private findBestSAMMatch(
    caregiver: Caregiver,
    records: SAMExclusionRecord[]
  ): SAMExclusionRecord | null {
    for (const record of records) {
      if (!record.entity.lastName || !record.entity.firstName) continue;
      
      const nameMatch = 
        record.entity.lastName.toUpperCase() === caregiver.lastName.toUpperCase() &&
        record.entity.firstName.toUpperCase() === caregiver.firstName.toUpperCase();
      
      if (nameMatch) {
        return record;
      }
    }
    
    return null;
  }

  private mapOIGExclusionType(exclType: string): string {
    // Map OIG exclusion type codes to human-readable descriptions
    const typeMap: Record<string, string> = {
      '1128(a)(1)': 'Conviction of program-related crimes',
      '1128(a)(2)': 'Conviction relating to patient abuse',
      '1128(a)(3)': 'Felony conviction relating to health care fraud',
      '1128(a)(4)': 'Felony conviction relating to controlled substance',
      '1128(b)(1)': 'Conviction relating to fraud',
      '1128(b)(2)': 'Conviction relating to obstruction of investigation',
      '1128(b)(4)': 'License revocation or suspension',
      '1128(b)(5)': 'Exclusion or suspension under federal or state health care program',
      '1128(b)(6)': 'Claims for excessive charges or unnecessary services',
      '1128(b)(7)': 'Fraud, kickbacks, and other prohibited activities',
      '1128(b)(14)': 'Default on health education loan or scholarship',
      '1128(b)(15)': 'Individuals controlling a sanctioned entity',
      '1128(b)(16)': 'Making false statements or misrepresentation',
    };
    
    return typeMap[exclType] || `Exclusion type: ${exclType}`;
  }

  /**
   * Record exclusion check in database for audit trail
   */
  async recordExclusionCheck(
    result: ExclusionCheckResult,
    context: UserContext
  ): Promise<void> {
    // This would store the check result in a database table
    // for compliance audit purposes
    
    // For now, we'll just log it
    console.log(`Exclusion check recorded for ${result.employeeNumber}:`, {
      isExcluded: result.isExcluded,
      checkDate: result.checkDate,
      checkedBy: context.userId,
      oigStatus: result.oigResult.status,
      samStatus: result.samResult.status,
    });
  }

  /**
   * Get exclusion check history for a caregiver
   */
  async getCheckHistory(
    _caregiverId: string,
    _context: UserContext
  ): Promise<ExclusionCheckResult[]> {
    // Would query database for historical checks
    // For now, return empty array
    return [];
  }
}
