/**
 * Audit Template Service
 *
 * Service for managing audit templates with predefined compliance templates
 */

import type {
  UserContext,
  UUID,
  PermissionError
} from '@care-commons/core';
import { PermissionService } from '@care-commons/core';
import type {
  AuditTemplate,
  AuditChecklistSection,
  CreateAuditTemplateInput
} from '../types/audit';

/**
 * Predefined audit templates for common compliance audits
 */
export class AuditTemplateService {
  constructor(private permissions: PermissionService) {}

  /**
   * Get all predefined audit templates
   */
  async getPredefinedTemplates(context: UserContext): Promise<AuditTemplate[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:view-templates')) {
      throw new Error('Insufficient permissions to view audit templates') as PermissionError;
    }

    return [
      this.getHIPAAComplianceTemplate(context.organizationId),
      this.getEVVComplianceTemplate(context.organizationId),
      this.getCarePlanAuditTemplate(context.organizationId),
      this.getMedicationAdministrationTemplate(context.organizationId),
      this.getInfectionControlTemplate(context.organizationId),
      this.getVisitQualityTemplate(context.organizationId),
      this.getCaregiverPerformanceTemplate(context.organizationId),
      this.getDocumentationAuditTemplate(context.organizationId)
    ];
  }

  /**
   * Get template by ID
   */
  async getTemplateById(
    templateId: string,
    context: UserContext
  ): Promise<AuditTemplate | null> {
    const templates = await this.getPredefinedTemplates(context);
    return templates.find(t => t.id === templateId) || null;
  }

  /**
   * HIPAA Compliance Audit Template
   */
  private getHIPAAComplianceTemplate(organizationId: UUID): AuditTemplate {
    const checklistSections: AuditChecklistSection[] = [
      {
        sectionId: 'privacy-rule',
        title: 'HIPAA Privacy Rule Compliance',
        description: 'Compliance with HIPAA Privacy Rule requirements',
        orderIndex: 1,
        weightPercentage: 40,
        items: [
          {
            itemId: 'privacy-1',
            question: 'Are patient authorizations obtained before disclosing PHI?',
            guidance: 'Verify that written authorizations are on file for all PHI disclosures',
            standardReference: '45 CFR § 164.508',
            responseType: 'YES_NO_NA',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 1,
            weight: 10
          },
          {
            itemId: 'privacy-2',
            question: 'Is there a current Notice of Privacy Practices in place?',
            guidance: 'Check that NPP is dated within the last 3 years and available to patients',
            standardReference: '45 CFR § 164.520',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 2,
            weight: 10
          },
          {
            itemId: 'privacy-3',
            question: 'Are minimum necessary standards applied to PHI disclosures?',
            guidance: 'Review disclosure logs to ensure only necessary PHI is shared',
            standardReference: '45 CFR § 164.502(b)',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 3,
            weight: 10
          },
          {
            itemId: 'privacy-4',
            question: 'Are patient rights to access PHI honored within 30 days?',
            guidance: 'Review access request logs for timely responses',
            standardReference: '45 CFR § 164.524',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 4,
            weight: 10
          }
        ]
      },
      {
        sectionId: 'security-rule',
        title: 'HIPAA Security Rule Compliance',
        description: 'Compliance with HIPAA Security Rule requirements',
        orderIndex: 2,
        weightPercentage: 35,
        items: [
          {
            itemId: 'security-1',
            question: 'Are access controls in place to limit PHI access to authorized users?',
            guidance: 'Verify role-based access controls and user permissions',
            standardReference: '45 CFR § 164.312(a)(1)',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 1,
            weight: 10
          },
          {
            itemId: 'security-2',
            question: 'Is PHI encrypted both in transit and at rest?',
            guidance: 'Check encryption certificates and SSL/TLS protocols',
            standardReference: '45 CFR § 164.312(a)(2)(iv)',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 2,
            weight: 10
          },
          {
            itemId: 'security-3',
            question: 'Are audit logs maintained for PHI access and modifications?',
            guidance: 'Review audit log configuration and retention policies',
            standardReference: '45 CFR § 164.312(b)',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 3,
            weight: 10
          },
          {
            itemId: 'security-4',
            question: 'Is a risk assessment conducted annually?',
            guidance: 'Verify completion date of most recent risk assessment',
            standardReference: '45 CFR § 164.308(a)(1)(ii)(A)',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 4,
            weight: 5
          }
        ]
      },
      {
        sectionId: 'training',
        title: 'HIPAA Training and Awareness',
        description: 'Staff training on HIPAA requirements',
        orderIndex: 3,
        weightPercentage: 25,
        items: [
          {
            itemId: 'training-1',
            question: 'Have all employees completed HIPAA training within the past year?',
            guidance: 'Review training records and completion certificates',
            standardReference: '45 CFR § 164.308(a)(5)',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 1,
            weight: 15
          },
          {
            itemId: 'training-2',
            question: 'Are Business Associate Agreements (BAAs) in place with all vendors?',
            guidance: 'Review vendor list and verify BAAs are current',
            standardReference: '45 CFR § 164.308(b)',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 2,
            weight: 10
          }
        ]
      }
    ];

    return {
      id: 'template-hipaa-compliance',
      templateName: 'HIPAA Compliance Audit',
      description: 'Comprehensive audit of HIPAA Privacy and Security Rule compliance',
      auditType: 'COMPLIANCE',
      applicableScope: ['ORGANIZATION', 'BRANCH', 'DEPARTMENT'],
      standardsReference: '45 CFR Parts 160, 162, and 164',
      templateVersion: '2.0',
      effectiveDate: new Date('2024-01-01'),
      expiryDate: null,
      checklistSections,
      isActive: true,
      usageCount: 0,
      lastUsedAt: null,
      organizationId,
      createdAt: new Date(),
      createdBy: 'system',
      updatedAt: new Date(),
      updatedBy: 'system',
      version: 1
    };
  }

  /**
   * EVV Compliance Audit Template
   */
  private getEVVComplianceTemplate(organizationId: UUID): AuditTemplate {
    const checklistSections: AuditChecklistSection[] = [
      {
        sectionId: 'evv-data-capture',
        title: 'EVV Data Capture Requirements',
        description: 'Six required EVV data elements per 21st Century Cures Act',
        orderIndex: 1,
        weightPercentage: 60,
        items: [
          {
            itemId: 'evv-1',
            question: 'Is the type of service provided captured for each visit?',
            guidance: 'Verify service type is recorded in EVV system',
            standardReference: '42 CFR § 441.735',
            responseType: 'COMPLIANT_NONCOMPLIANT',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 1,
            weight: 10
          },
          {
            itemId: 'evv-2',
            question: 'Is the individual receiving the service identified?',
            guidance: 'Check that client ID is captured for each visit',
            standardReference: '42 CFR § 441.735',
            responseType: 'COMPLIANT_NONCOMPLIANT',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 2,
            weight: 10
          },
          {
            itemId: 'evv-3',
            question: 'Is the date of service recorded?',
            guidance: 'Verify date stamp is accurate and captured',
            standardReference: '42 CFR § 441.735',
            responseType: 'COMPLIANT_NONCOMPLIANT',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 3,
            weight: 10
          },
          {
            itemId: 'evv-4',
            question: 'Is the location of service delivery captured via GPS or alternative method?',
            guidance: 'Check geolocation data or attestation',
            standardReference: '42 CFR § 441.735',
            responseType: 'COMPLIANT_NONCOMPLIANT',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 4,
            weight: 10
          },
          {
            itemId: 'evv-5',
            question: 'Are the individual providing the service identified?',
            guidance: 'Verify caregiver ID is captured',
            standardReference: '42 CFR § 441.735',
            responseType: 'COMPLIANT_NONCOMPLIANT',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 5,
            weight: 10
          },
          {
            itemId: 'evv-6',
            question: 'Are the time service begins and ends captured?',
            guidance: 'Check clock-in and clock-out timestamps',
            standardReference: '42 CFR § 441.735',
            responseType: 'COMPLIANT_NONCOMPLIANT',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 6,
            weight: 10
          }
        ]
      },
      {
        sectionId: 'evv-system',
        title: 'EVV System Functionality',
        description: 'Technical compliance of EVV system',
        orderIndex: 2,
        weightPercentage: 40,
        items: [
          {
            itemId: 'evv-sys-1',
            question: 'Does the EVV system have anti-fraud safeguards?',
            guidance: 'Check for geofencing, duplicate visit prevention, etc.',
            standardReference: 'State EVV Requirements',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 1,
            weight: 10
          },
          {
            itemId: 'evv-sys-2',
            question: 'Are visit exceptions (GPS failures) properly documented?',
            guidance: 'Review exception logs and attestations',
            standardReference: 'State EVV Requirements',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 2,
            weight: 10
          },
          {
            itemId: 'evv-sys-3',
            question: 'Is EVV data aggregated and submitted to state system timely?',
            guidance: 'Verify data transmission logs and state submissions',
            standardReference: 'State EVV Requirements',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 3,
            weight: 20
          }
        ]
      }
    ];

    return {
      id: 'template-evv-compliance',
      templateName: 'EVV Compliance Audit',
      description: 'Electronic Visit Verification compliance audit per 21st Century Cures Act',
      auditType: 'COMPLIANCE',
      applicableScope: ['ORGANIZATION', 'BRANCH'],
      standardsReference: '42 CFR § 441.735',
      templateVersion: '1.0',
      effectiveDate: new Date('2024-01-01'),
      expiryDate: null,
      checklistSections,
      isActive: true,
      usageCount: 0,
      lastUsedAt: null,
      organizationId,
      createdAt: new Date(),
      createdBy: 'system',
      updatedAt: new Date(),
      updatedBy: 'system',
      version: 1
    };
  }

  /**
   * Care Plan Quality Audit Template
   */
  private getCarePlanAuditTemplate(organizationId: UUID): AuditTemplate {
    const checklistSections: AuditChecklistSection[] = [
      {
        sectionId: 'care-plan-content',
        title: 'Care Plan Content Quality',
        description: 'Quality and completeness of care plan documentation',
        orderIndex: 1,
        weightPercentage: 50,
        items: [
          {
            itemId: 'cp-1',
            question: 'Are client goals SMART (Specific, Measurable, Achievable, Relevant, Time-bound)?',
            guidance: 'Review goals for SMART criteria',
            responseType: 'RATING',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 1,
            weight: 10
          },
          {
            itemId: 'cp-2',
            question: 'Are interventions clearly documented and linked to goals?',
            guidance: 'Check that each intervention supports a specific goal',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 2,
            weight: 10
          },
          {
            itemId: 'cp-3',
            question: 'Is the care plan reviewed and updated at required intervals?',
            guidance: 'Verify review dates meet state/payer requirements (typically 90 days)',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 3,
            weight: 15
          },
          {
            itemId: 'cp-4',
            question: 'Are client/family members involved in care plan development?',
            guidance: 'Check for signatures or documented participation',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 4,
            weight: 15
          }
        ]
      },
      {
        sectionId: 'care-plan-outcomes',
        title: 'Outcomes and Progress Tracking',
        description: 'Tracking of goal progress and outcomes',
        orderIndex: 2,
        weightPercentage: 50,
        items: [
          {
            itemId: 'cp-out-1',
            question: 'Are progress notes completed after each visit?',
            guidance: 'Review visit records for corresponding progress notes',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 1,
            weight: 20
          },
          {
            itemId: 'cp-out-2',
            question: 'Is goal progress measured and documented?',
            guidance: 'Check for quantifiable progress indicators',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 2,
            weight: 15
          },
          {
            itemId: 'cp-out-3',
            question: 'Are care plans modified based on outcomes?',
            guidance: 'Look for evidence of care plan adjustments',
            responseType: 'YES_NO',
            isMandatory: false,
            requiresEvidence: false,
            orderIndex: 3,
            weight: 15
          }
        ]
      }
    ];

    return {
      id: 'template-care-plan-audit',
      templateName: 'Care Plan Quality Audit',
      description: 'Assessment of care plan quality, completeness, and outcomes tracking',
      auditType: 'QUALITY',
      applicableScope: ['CLIENT', 'CAREGIVER'],
      standardsReference: 'CMS Home Health Conditions of Participation',
      templateVersion: '1.0',
      effectiveDate: new Date('2024-01-01'),
      expiryDate: null,
      checklistSections,
      isActive: true,
      usageCount: 0,
      lastUsedAt: null,
      organizationId,
      createdAt: new Date(),
      createdBy: 'system',
      updatedAt: new Date(),
      updatedBy: 'system',
      version: 1
    };
  }

  /**
   * Medication Administration Audit Template
   */
  private getMedicationAdministrationTemplate(organizationId: UUID): AuditTemplate {
    const checklistSections: AuditChecklistSection[] = [
      {
        sectionId: 'med-admin',
        title: 'Medication Administration Safety',
        description: 'Five Rights of medication administration',
        orderIndex: 1,
        weightPercentage: 100,
        items: [
          {
            itemId: 'med-1',
            question: 'Right Patient: Is patient identity verified before administration?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 1,
            weight: 20
          },
          {
            itemId: 'med-2',
            question: 'Right Drug: Is the correct medication administered?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 2,
            weight: 20
          },
          {
            itemId: 'med-3',
            question: 'Right Dose: Is the correct dose administered?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 3,
            weight: 20
          },
          {
            itemId: 'med-4',
            question: 'Right Route: Is medication given via the correct route?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 4,
            weight: 20
          },
          {
            itemId: 'med-5',
            question: 'Right Time: Is medication administered at the correct time?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 5,
            weight: 20
          }
        ]
      }
    ];

    return {
      id: 'template-medication-audit',
      templateName: 'Medication Administration Audit',
      description: 'Audit of medication administration safety and compliance',
      auditType: 'MEDICATION',
      applicableScope: ['CAREGIVER', 'CLIENT', 'PROCESS'],
      templateVersion: '1.0',
      effectiveDate: new Date('2024-01-01'),
      expiryDate: null,
      checklistSections,
      isActive: true,
      usageCount: 0,
      lastUsedAt: null,
      organizationId,
      createdAt: new Date(),
      createdBy: 'system',
      updatedAt: new Date(),
      updatedBy: 'system',
      version: 1
    };
  }

  /**
   * Infection Control Audit Template
   */
  private getInfectionControlTemplate(organizationId: UUID): AuditTemplate {
    const checklistSections: AuditChecklistSection[] = [
      {
        sectionId: 'infection-control',
        title: 'Infection Control Practices',
        description: 'Standard precautions and infection control measures',
        orderIndex: 1,
        weightPercentage: 100,
        items: [
          {
            itemId: 'ic-1',
            question: 'Are caregivers performing hand hygiene before and after each client contact?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 1,
            weight: 20
          },
          {
            itemId: 'ic-2',
            question: 'Are PPE (gloves, masks) used appropriately when indicated?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 2,
            weight: 20
          },
          {
            itemId: 'ic-3',
            question: 'Are medical equipment and supplies properly cleaned/disinfected?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 3,
            weight: 15
          },
          {
            itemId: 'ic-4',
            question: 'Are sharps disposed of in appropriate containers?',
            responseType: 'YES_NO_NA',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 4,
            weight: 15
          },
          {
            itemId: 'ic-5',
            question: 'Are infection control training records current (within 12 months)?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 5,
            weight: 15
          },
          {
            itemId: 'ic-6',
            question: 'Are COVID-19 protocols being followed?',
            responseType: 'YES_NO_NA',
            isMandatory: false,
            requiresEvidence: false,
            orderIndex: 6,
            weight: 15
          }
        ]
      }
    ];

    return {
      id: 'template-infection-control',
      templateName: 'Infection Control Audit',
      description: 'Assessment of infection control and prevention practices',
      auditType: 'SAFETY',
      applicableScope: ['CAREGIVER', 'BRANCH', 'PROCESS'],
      standardsReference: 'CDC Infection Control Guidelines',
      templateVersion: '1.0',
      effectiveDate: new Date('2024-01-01'),
      expiryDate: null,
      checklistSections,
      isActive: true,
      usageCount: 0,
      lastUsedAt: null,
      organizationId,
      createdAt: new Date(),
      createdBy: 'system',
      updatedAt: new Date(),
      updatedBy: 'system',
      version: 1
    };
  }

  /**
   * Visit Quality Audit Template
   */
  private getVisitQualityTemplate(organizationId: UUID): AuditTemplate {
    const checklistSections: AuditChecklistSection[] = [
      {
        sectionId: 'visit-documentation',
        title: 'Visit Documentation Quality',
        description: 'Quality of visit documentation',
        orderIndex: 1,
        weightPercentage: 50,
        items: [
          {
            itemId: 'vq-1',
            question: 'Are visit notes completed same-day?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 1,
            weight: 15
          },
          {
            itemId: 'vq-2',
            question: 'Do visit notes describe services provided in detail?',
            responseType: 'RATING',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 2,
            weight: 15
          },
          {
            itemId: 'vq-3',
            question: 'Are visit notes signed/authenticated by the caregiver?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 3,
            weight: 10
          },
          {
            itemId: 'vq-4',
            question: 'Are client changes in condition documented?',
            responseType: 'YES_NO_NA',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 4,
            weight: 10
          }
        ]
      },
      {
        sectionId: 'visit-compliance',
        title: 'Visit Compliance',
        description: 'Compliance with scheduled visits',
        orderIndex: 2,
        weightPercentage: 50,
        items: [
          {
            itemId: 'vc-1',
            question: 'Was the visit performed within the scheduled time window?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 1,
            weight: 20
          },
          {
            itemId: 'vc-2',
            question: 'Were all scheduled tasks completed during the visit?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 2,
            weight: 15
          },
          {
            itemId: 'vc-3',
            question: 'If tasks were incomplete, was the reason documented?',
            responseType: 'YES_NO_NA',
            isMandatory: false,
            requiresEvidence: false,
            orderIndex: 3,
            weight: 15
          }
        ]
      }
    ];

    return {
      id: 'template-visit-quality',
      templateName: 'Visit Quality Audit',
      description: 'Review of visit documentation quality and compliance',
      auditType: 'QUALITY',
      applicableScope: ['CAREGIVER', 'CLIENT'],
      templateVersion: '1.0',
      effectiveDate: new Date('2024-01-01'),
      expiryDate: null,
      checklistSections,
      isActive: true,
      usageCount: 0,
      lastUsedAt: null,
      organizationId,
      createdAt: new Date(),
      createdBy: 'system',
      updatedAt: new Date(),
      updatedBy: 'system',
      version: 1
    };
  }

  /**
   * Caregiver Performance Audit Template
   */
  private getCaregiverPerformanceTemplate(organizationId: UUID): AuditTemplate {
    const checklistSections: AuditChecklistSection[] = [
      {
        sectionId: 'cg-credentials',
        title: 'Caregiver Credentials and Training',
        description: 'Verification of credentials and training compliance',
        orderIndex: 1,
        weightPercentage: 40,
        items: [
          {
            itemId: 'cg-1',
            question: 'Are all required certifications current and valid?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 1,
            weight: 15
          },
          {
            itemId: 'cg-2',
            question: 'Has annual competency assessment been completed?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 2,
            weight: 15
          },
          {
            itemId: 'cg-3',
            question: 'Are continuing education requirements met?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 3,
            weight: 10
          }
        ]
      },
      {
        sectionId: 'cg-performance',
        title: 'Job Performance',
        description: 'Assessment of caregiver job performance',
        orderIndex: 2,
        weightPercentage: 60,
        items: [
          {
            itemId: 'cgp-1',
            question: 'Are visits consistently completed on time?',
            responseType: 'RATING',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 1,
            weight: 15
          },
          {
            itemId: 'cgp-2',
            question: 'Are client satisfaction scores above threshold (4/5)?',
            responseType: 'YES_NO',
            isMandatory: false,
            requiresEvidence: true,
            orderIndex: 2,
            weight: 15
          },
          {
            itemId: 'cgp-3',
            question: 'Are documentation standards consistently met?',
            responseType: 'RATING',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 3,
            weight: 15
          },
          {
            itemId: 'cgp-4',
            question: 'Have there been any incidents/complaints in the review period?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 4,
            weight: 15
          }
        ]
      }
    ];

    return {
      id: 'template-caregiver-performance',
      templateName: 'Caregiver Performance Audit',
      description: 'Evaluation of caregiver credentials, training, and performance',
      auditType: 'QUALITY',
      applicableScope: ['CAREGIVER'],
      templateVersion: '1.0',
      effectiveDate: new Date('2024-01-01'),
      expiryDate: null,
      checklistSections,
      isActive: true,
      usageCount: 0,
      lastUsedAt: null,
      organizationId,
      createdAt: new Date(),
      createdBy: 'system',
      updatedAt: new Date(),
      updatedBy: 'system',
      version: 1
    };
  }

  /**
   * Documentation Audit Template
   */
  private getDocumentationAuditTemplate(organizationId: UUID): AuditTemplate {
    const checklistSections: AuditChecklistSection[] = [
      {
        sectionId: 'doc-completeness',
        title: 'Documentation Completeness',
        description: 'Completeness of required documentation',
        orderIndex: 1,
        weightPercentage: 60,
        items: [
          {
            itemId: 'doc-1',
            question: 'Is the initial assessment complete and signed?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 1,
            weight: 15
          },
          {
            itemId: 'doc-2',
            question: 'Are physician orders current and signed?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 2,
            weight: 15
          },
          {
            itemId: 'doc-3',
            question: 'Are consent forms complete and properly executed?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 3,
            weight: 15
          },
          {
            itemId: 'doc-4',
            question: 'Are emergency contact information and advance directives on file?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 4,
            weight: 15
          }
        ]
      },
      {
        sectionId: 'doc-accuracy',
        title: 'Documentation Accuracy',
        description: 'Accuracy and timeliness of documentation',
        orderIndex: 2,
        weightPercentage: 40,
        items: [
          {
            itemId: 'doca-1',
            question: 'Are dates and times accurately recorded?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 1,
            weight: 15
          },
          {
            itemId: 'doca-2',
            question: 'Are corrections made using proper strike-through method?',
            responseType: 'YES_NO_NA',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 2,
            weight: 10
          },
          {
            itemId: 'doca-3',
            question: 'Is documentation legible and professional?',
            responseType: 'RATING',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 3,
            weight: 15
          }
        ]
      }
    ];

    return {
      id: 'template-documentation-audit',
      templateName: 'Documentation Audit',
      description: 'Review of documentation completeness, accuracy, and timeliness',
      auditType: 'DOCUMENTATION',
      applicableScope: ['CLIENT', 'CAREGIVER', 'PROCESS'],
      templateVersion: '1.0',
      effectiveDate: new Date('2024-01-01'),
      expiryDate: null,
      checklistSections,
      isActive: true,
      usageCount: 0,
      lastUsedAt: null,
      organizationId,
      createdAt: new Date(),
      createdBy: 'system',
      updatedAt: new Date(),
      updatedBy: 'system',
      version: 1
    };
  }

  /**
   * Create custom audit template
   */
  async createCustomTemplate(
    input: CreateAuditTemplateInput,
    context: UserContext
  ): Promise<AuditTemplate> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:create-templates')) {
      throw new Error('Insufficient permissions to create audit templates') as PermissionError;
    }

    // In a real implementation, this would save to a repository
    const template: AuditTemplate = {
      id: `custom-${Date.now()}`,
      ...input,
      isActive: true,
      usageCount: 0,
      lastUsedAt: null,
      organizationId: context.organizationId,
      createdAt: new Date(),
      createdBy: context.userId,
      updatedAt: new Date(),
      updatedBy: context.userId,
      version: 1
    };

    return template;
  }
}
