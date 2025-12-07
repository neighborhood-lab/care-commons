/**
 * Patient Hospitalization Risk Prediction Service
 *
 * CLINICAL AI: Identifies patients at risk of hospitalization BEFORE it happens.
 * Early intervention prevents hospitalizations, improves outcomes, and reduces costs.
 *
 * Evidence-Based Risk Factors (Research-Backed):
 * - Dyspnea severity (breathing difficulty)
 * - Functional disability level (ADL limitations)
 * - Skin/wound problems
 * - Diabetes with complications
 * - Multiple medications (polypharmacy >9 drugs)
 * - Recent ER visits or hospitalizations
 * - Weight loss or falls
 * - Social isolation
 * - Medication non-adherence
 *
 * Research Sources:
 * - PubMed 37553081: Social risk factors in home health care
 * - BMC Health Services Research: Predictive modeling for home care elderly
 * - Medicare home care hospitalization risk factors studies
 *
 * Why This Matters:
 * - Preventable hospitalizations cost $30B+/year
 * - Early intervention reduces hospitalization by 25-40%
 * - Improves patient outcomes and quality of life
 * - Helps home care agencies provide proactive care
 */

import { UUID, UserContext, ValidationError } from '@folkcare/core';

/**
 * Hospitalization risk assessment result
 */
export interface HospitalizationRiskAssessment {
  clientId: UUID;
  clientName: string;
  overallRiskScore: number; // 0-100, higher = higher risk
  riskLevel: HospitalizationRiskLevel;
  riskFactors: ClinicalRiskFactor[];
  interventionRecommendations: InterventionRecommendation[];
  assessedAt: Date;
  nextAssessmentDue: Date;
  trendDirection: 'IMPROVING' | 'STABLE' | 'WORSENING';
  estimatedHospitalizationProbability: number; // 0-1 probability next 30 days
}

export type HospitalizationRiskLevel =
  | 'LOW' // 0-25: Minimal risk
  | 'MODERATE' // 26-50: Some concerning factors
  | 'HIGH' // 51-75: Intervention recommended
  | 'CRITICAL'; // 76-100: Immediate clinical review required

/**
 * Individual clinical risk factor
 */
export interface ClinicalRiskFactor {
  category: RiskFactorCategory;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  score: number; // Contribution to overall risk (0-15)
  clinicalDescription: string;
  evidence: string[]; // Specific clinical data supporting this factor
  detectedAt: Date;
  requiresUrgentReview: boolean;
}

export type RiskFactorCategory =
  | 'RESPIRATORY_DISTRESS' // Dyspnea, breathing problems
  | 'FUNCTIONAL_DECLINE' // ADL limitations, mobility issues
  | 'WOUND_CARE' // Pressure ulcers, slow-healing wounds
  | 'CHRONIC_DISEASE' // Diabetes, CHF, COPD complications
  | 'POLYPHARMACY' // >9 medications
  | 'RECENT_HOSPITALIZATION' // Hospital/ER in last 30 days
  | 'WEIGHT_LOSS' // Unintentional weight loss
  | 'FALLS_RISK' // Recent falls or high fall risk
  | 'MEDICATION_ADHERENCE' // Non-adherence patterns
  | 'SOCIAL_ISOLATION' // Lack of support system
  | 'COGNITIVE_DECLINE' // Dementia, confusion
  | 'INFECTION_RISK'; // UTI, pneumonia risk factors

/**
 * Clinical intervention recommendation
 */
export interface InterventionRecommendation {
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: InterventionCategory;
  clinicalAction: string;
  rationale: string;
  expectedOutcome: string;
  responsibleRole: 'NURSE' | 'PHYSICIAN' | 'CAREGIVER' | 'COORDINATOR';
}

export type InterventionCategory =
  | 'CLINICAL_REVIEW' // Nurse or physician assessment needed
  | 'MEDICATION_REVIEW' // Pharmacist or physician review
  | 'WOUND_CARE' // Wound care specialist
  | 'PHYSICAL_THERAPY' // PT evaluation for mobility
  | 'NUTRITION' // Dietician consult
  | 'CARE_PLAN_UPDATE' // Update care plan with new interventions
  | 'INCREASE_MONITORING' // More frequent visits
  | 'FAMILY_EDUCATION' // Educate family on warning signs
  | 'EQUIPMENT' // DME or assistive devices needed
  | 'SOCIAL_SERVICES'; // Social worker intervention

/**
 * Patient clinical data for risk assessment
 */
export interface PatientClinicalData {
  clientId: UUID;

  // Demographics
  age: number;
  gender: 'M' | 'F' | 'other';

  // Recent vitals (last 7 days)
  recentVitals?: {
    bloodPressureSystolic?: number[];
    bloodPressureDiastolic?: number[];
    heartRate?: number[];
    respiratoryRate?: number[];
    oxygenSaturation?: number[];
    temperature?: number[];
    weight?: number[];
  };

  // Clinical conditions
  diagnoses: string[];
  chronicConditions: ChronicCondition[];

  // Functional status
  adlLimitations: number; // 0-6 (bathing, dressing, toileting, transferring, continence, feeding)
  iadlLimitations: number; // 0-8 (phone, shopping, food prep, housekeeping, laundry, transport, meds, finances)
  mobilityLevel: 'independent' | 'walker' | 'wheelchair' | 'bedbound';

  // Medications
  currentMedications: Medication[];

  // Recent events
  recentHospitalizations: number; // Count in last 30 days
  recentERVisits: number; // Count in last 30 days
  recentFalls: number; // Count in last 30 days

  // Wound/skin issues
  hasOpenWounds: boolean;
  woundCount?: number;
  woundTypes?: string[];

  // Social factors
  livesAlone: boolean;
  hasCaregiverSupport: boolean;
  socialIsolationScore: number; // 0-10, higher = more isolated

  // Care patterns
  missedVisits: number; // Count in last 30 days
  medicationAdherenceRate: number; // 0-1, higher = better adherence
}

export interface ChronicCondition {
  condition: string;
  diagnosedDate: Date;
  controlled: boolean;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  isHighRisk?: boolean; // e.g., anticoagulants, insulin
}

/**
 * Provider interface for fetching patient clinical data
 */
export interface IClinicalDataProvider {
  getPatientClinicalData(
    clientId: UUID,
    context: UserContext
  ): Promise<PatientClinicalData>;
}

/**
 * Hospitalization Risk Prediction Service
 */
export class HospitalizationRiskService {
  private clinicalDataProvider?: IClinicalDataProvider;

  /**
   * Set clinical data provider
   */
  setClinicalDataProvider(provider: IClinicalDataProvider): void {
    this.clinicalDataProvider = provider;
  }

  /**
   * Assess hospitalization risk for a single patient
   */
  async assessPatientRisk(
    clientId: UUID,
    clientName: string,
    context: UserContext
  ): Promise<HospitalizationRiskAssessment> {
    // FAIL FAST: Require clinical data provider
    if (!this.clinicalDataProvider) {
      throw new ValidationError(
        'ClinicalDataProvider not configured. Cannot assess hospitalization risk.',
        {
          hint: 'Inject an IClinicalDataProvider implementation when instantiating HospitalizationRiskService',
        }
      );
    }

    // Get patient clinical data
    const clinicalData = await this.clinicalDataProvider.getPatientClinicalData(
      clientId,
      context
    );

    // Analyze risk factors
    const riskFactors = this.analyzeRiskFactors(clinicalData);

    // Calculate overall risk score
    const overallRiskScore = this.calculateOverallRisk(riskFactors);
    const riskLevel = this.determineRiskLevel(overallRiskScore);

    // Estimate hospitalization probability (simplified logistic regression)
    const estimatedHospitalizationProbability = this.estimateHospitalizationProbability(
      overallRiskScore,
      clinicalData
    );

    // Generate intervention recommendations
    const interventionRecommendations = this.generateInterventions(
      riskFactors,
      riskLevel,
      clinicalData
    );

    // Determine trend (requires historical data - placeholder for now)
    const trendDirection = 'STABLE'; // TODO: Compare with previous assessment

    return {
      clientId,
      clientName,
      overallRiskScore,
      riskLevel,
      riskFactors,
      interventionRecommendations,
      assessedAt: new Date(),
      nextAssessmentDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      trendDirection,
      estimatedHospitalizationProbability,
    };
  }

  /**
   * Analyze clinical data to identify risk factors
   */
  private analyzeRiskFactors(data: PatientClinicalData): ClinicalRiskFactor[] {
    const factors: ClinicalRiskFactor[] = [];
    const now = new Date();

    // 1. Respiratory Distress (dyspnea severity)
    if (data.recentVitals?.oxygenSaturation) {
      const avgO2 = this.average(data.recentVitals.oxygenSaturation);
      const minO2 = Math.min(...data.recentVitals.oxygenSaturation);

      if (avgO2 < 95 || minO2 < 92) {
        const severity = minO2 < 88 ? 'CRITICAL' : minO2 < 92 ? 'HIGH' : 'MODERATE';
        factors.push({
          category: 'RESPIRATORY_DISTRESS',
          severity,
          score: minO2 < 88 ? 15 : minO2 < 92 ? 10 : 6,
          clinicalDescription: `Low oxygen saturation: Average ${avgO2.toFixed(1)}%, Minimum ${minO2}%`,
          evidence: [
            `Recent O2 sat readings: ${data.recentVitals.oxygenSaturation.join(', ')}%`,
            'Respiratory distress is #1 predictor of hospitalization',
          ],
          detectedAt: now,
          requiresUrgentReview: minO2 < 88,
        });
      }
    }

    // Check respiratory rate
    if (data.recentVitals?.respiratoryRate) {
      const avgRR = this.average(data.recentVitals.respiratoryRate);
      if (avgRR > 24 || avgRR < 12) {
        factors.push({
          category: 'RESPIRATORY_DISTRESS',
          severity: avgRR > 30 || avgRR < 10 ? 'CRITICAL' : 'HIGH',
          score: avgRR > 30 || avgRR < 10 ? 12 : 8,
          clinicalDescription: `Abnormal respiratory rate: ${avgRR.toFixed(1)} breaths/min`,
          evidence: [
            `Normal range: 12-20 breaths/min`,
            `Recent readings: ${data.recentVitals.respiratoryRate.join(', ')}`,
          ],
          detectedAt: now,
          requiresUrgentReview: avgRR > 30 || avgRR < 10,
        });
      }
    }

    // 2. Functional Decline (ADL/IADL limitations)
    const totalLimitations = data.adlLimitations + data.iadlLimitations;
    if (totalLimitations > 8) {
      factors.push({
        category: 'FUNCTIONAL_DECLINE',
        severity: totalLimitations > 12 ? 'CRITICAL' : totalLimitations > 10 ? 'HIGH' : 'MODERATE',
        score: Math.min(totalLimitations, 12),
        clinicalDescription: `Severe functional limitations: ${data.adlLimitations} ADL + ${data.iadlLimitations} IADL`,
        evidence: [
          `ADL limitations: ${data.adlLimitations}/6`,
          `IADL limitations: ${data.iadlLimitations}/8`,
          'Functional decline strongly predicts hospitalization',
        ],
        detectedAt: now,
        requiresUrgentReview: totalLimitations > 12,
      });
    }

    // 3. Wound Care Issues
    if (data.hasOpenWounds) {
      const severity = (data.woundCount || 1) > 2 ? 'CRITICAL' : (data.woundCount || 1) > 1 ? 'HIGH' : 'MODERATE';
      factors.push({
        category: 'WOUND_CARE',
        severity,
        score: (data.woundCount || 1) * 4,
        clinicalDescription: `Open wounds present: ${data.woundCount || 1} wound(s)`,
        evidence: [
          `Wound types: ${data.woundTypes?.join(', ') || 'Not specified'}`,
          'Skin/wound problems increase hospitalization risk',
        ],
        detectedAt: now,
        requiresUrgentReview: (data.woundCount || 1) > 2,
      });
    }

    // 4. Chronic Disease Management
    const uncontrolledConditions = data.chronicConditions.filter(c => !c.controlled);
    if (uncontrolledConditions.length > 0) {
      factors.push({
        category: 'CHRONIC_DISEASE',
        severity: uncontrolledConditions.length > 2 ? 'HIGH' : 'MODERATE',
        score: uncontrolledConditions.length * 5,
        clinicalDescription: `Uncontrolled chronic conditions: ${uncontrolledConditions.length}`,
        evidence: uncontrolledConditions.map(c => `${c.condition} (uncontrolled)`),
        detectedAt: now,
        requiresUrgentReview: uncontrolledConditions.length > 2,
      });
    }

    // 5. Polypharmacy (>9 medications)
    if (data.currentMedications.length > 9) {
      const highRiskMeds = data.currentMedications.filter(m => m.isHighRisk);
      factors.push({
        category: 'POLYPHARMACY',
        severity: data.currentMedications.length > 15 ? 'HIGH' : 'MODERATE',
        score: Math.min(data.currentMedications.length - 9, 10),
        clinicalDescription: `Polypharmacy: ${data.currentMedications.length} medications`,
        evidence: [
          `High-risk medications: ${highRiskMeds.length}`,
          'Polypharmacy increases adverse events and hospitalization',
        ],
        detectedAt: now,
        requiresUrgentReview: highRiskMeds.length > 3,
      });
    }

    // 6. Recent Hospitalization/ER
    if (data.recentHospitalizations > 0 || data.recentERVisits > 0) {
      const totalEvents = data.recentHospitalizations + data.recentERVisits;
      factors.push({
        category: 'RECENT_HOSPITALIZATION',
        severity: totalEvents > 2 ? 'CRITICAL' : totalEvents > 1 ? 'HIGH' : 'MODERATE',
        score: totalEvents * 5,
        clinicalDescription: `Recent acute care: ${data.recentHospitalizations} hospitalizations, ${data.recentERVisits} ER visits`,
        evidence: [
          'Recent hospitalization is strongest predictor of re-hospitalization',
          'High-risk period: 30 days post-discharge',
        ],
        detectedAt: now,
        requiresUrgentReview: totalEvents > 2,
      });
    }

    // 7. Weight Loss (from vitals)
    if (data.recentVitals?.weight && data.recentVitals.weight.length > 1) {
      const weights = data.recentVitals.weight;
      const weightChange = weights[weights.length - 1]! - weights[0]!;
      const percentChange = (weightChange / weights[0]!) * 100;

      if (percentChange < -5) {
        factors.push({
          category: 'WEIGHT_LOSS',
          severity: percentChange < -10 ? 'CRITICAL' : percentChange < -7.5 ? 'HIGH' : 'MODERATE',
          score: Math.abs(percentChange),
          clinicalDescription: `Unintentional weight loss: ${percentChange.toFixed(1)}%`,
          evidence: [
            `Weight change: ${weights[0]} → ${weights[weights.length - 1]} lbs`,
            '>5% weight loss in 30 days is concerning',
          ],
          detectedAt: now,
          requiresUrgentReview: percentChange < -10,
        });
      }
    }

    // 8. Falls Risk
    if (data.recentFalls > 0) {
      factors.push({
        category: 'FALLS_RISK',
        severity: data.recentFalls > 2 ? 'CRITICAL' : data.recentFalls > 1 ? 'HIGH' : 'MODERATE',
        score: data.recentFalls * 4,
        clinicalDescription: `Recent falls: ${data.recentFalls} in last 30 days`,
        evidence: [
          'Falls increase fracture risk and hospitalization',
          'Indicates mobility/balance issues',
        ],
        detectedAt: now,
        requiresUrgentReview: data.recentFalls > 2,
      });
    }

    // 9. Medication Adherence
    if (data.medicationAdherenceRate < 0.8) {
      factors.push({
        category: 'MEDICATION_ADHERENCE',
        severity: data.medicationAdherenceRate < 0.5 ? 'HIGH' : 'MODERATE',
        score: (1 - data.medicationAdherenceRate) * 10,
        clinicalDescription: `Poor medication adherence: ${(data.medicationAdherenceRate * 100).toFixed(0)}%`,
        evidence: [
          'Non-adherence leads to disease progression',
          'Target adherence: >80%',
        ],
        detectedAt: now,
        requiresUrgentReview: data.medicationAdherenceRate < 0.5,
      });
    }

    // 10. Social Isolation
    if (data.livesAlone && !data.hasCaregiverSupport) {
      factors.push({
        category: 'SOCIAL_ISOLATION',
        severity: data.socialIsolationScore > 7 ? 'HIGH' : 'MODERATE',
        score: data.socialIsolationScore,
        clinicalDescription: `Social isolation: Lives alone without caregiver support`,
        evidence: [
          `Isolation score: ${data.socialIsolationScore}/10`,
          'Social isolation increases hospitalization risk by 30%',
        ],
        detectedAt: now,
        requiresUrgentReview: false,
      });
    }

    return factors;
  }

  /**
   * Calculate overall risk score from individual factors
   */
  private calculateOverallRisk(factors: ClinicalRiskFactor[]): number {
    const totalScore = factors.reduce((sum, factor) => sum + factor.score, 0);
    return Math.min(totalScore, 100);
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): HospitalizationRiskLevel {
    if (score >= 76) return 'CRITICAL';
    if (score >= 51) return 'HIGH';
    if (score >= 26) return 'MODERATE';
    return 'LOW';
  }

  /**
   * Estimate hospitalization probability (simplified logistic regression)
   */
  private estimateHospitalizationProbability(
    riskScore: number,
    _data: PatientClinicalData
  ): number {
    // Simplified probability estimation
    // Real implementation would use validated clinical prediction model
    const logit = -3 + (riskScore / 100) * 6; // Maps 0-100 score to probability
    return 1 / (1 + Math.exp(-logit));
  }

  /**
   * Generate clinical interventions based on risk factors
   */
  private generateInterventions(
    factors: ClinicalRiskFactor[],
    riskLevel: HospitalizationRiskLevel,
    _data: PatientClinicalData
  ): InterventionRecommendation[] {
    const interventions: InterventionRecommendation[] = [];

    // Urgent interventions for critical factors
    const criticalFactors = factors.filter(f => f.requiresUrgentReview);
    if (criticalFactors.length > 0) {
      interventions.push({
        priority: 'URGENT',
        category: 'CLINICAL_REVIEW',
        clinicalAction: 'Immediate RN or physician assessment required',
        rationale: `${criticalFactors.length} critical risk factors detected`,
        expectedOutcome: 'Prevent imminent hospitalization through early intervention',
        responsibleRole: 'NURSE',
      });
    }

    // Specific interventions by factor category
    for (const factor of factors) {
      switch (factor.category) {
        case 'RESPIRATORY_DISTRESS':
          if (factor.severity === 'CRITICAL' || factor.severity === 'HIGH') {
            interventions.push({
              priority: factor.severity === 'CRITICAL' ? 'URGENT' : 'HIGH',
              category: 'CLINICAL_REVIEW',
              clinicalAction: 'Assess respiratory status, consider oxygen therapy or medication adjustment',
              rationale: factor.clinicalDescription,
              expectedOutcome: 'Stabilize respiratory function, prevent pneumonia/COPD exacerbation',
              responsibleRole: 'PHYSICIAN',
            });
          }
          break;

        case 'WOUND_CARE':
          interventions.push({
            priority: factor.severity === 'CRITICAL' ? 'URGENT' : 'HIGH',
            category: 'WOUND_CARE',
            clinicalAction: 'Wound care specialist consult, increase wound care visits',
            rationale: factor.clinicalDescription,
            expectedOutcome: 'Promote wound healing, prevent infection',
            responsibleRole: 'NURSE',
          });
          break;

        case 'POLYPHARMACY':
          interventions.push({
            priority: 'HIGH',
            category: 'MEDICATION_REVIEW',
            clinicalAction: 'Comprehensive medication review with physician/pharmacist',
            rationale: factor.clinicalDescription,
            expectedOutcome: 'Reduce adverse drug events, simplify regimen',
            responsibleRole: 'PHYSICIAN',
          });
          break;

        case 'FUNCTIONAL_DECLINE':
          interventions.push({
            priority: 'HIGH',
            category: 'PHYSICAL_THERAPY',
            clinicalAction: 'Physical therapy evaluation for mobility/ADL training',
            rationale: factor.clinicalDescription,
            expectedOutcome: 'Improve functional independence, reduce fall risk',
            responsibleRole: 'NURSE',
          });
          break;

        case 'WEIGHT_LOSS':
          interventions.push({
            priority: 'HIGH',
            category: 'NUTRITION',
            clinicalAction: 'Dietician consult for nutritional assessment and intervention',
            rationale: factor.clinicalDescription,
            expectedOutcome: 'Restore nutritional status, prevent malnutrition complications',
            responsibleRole: 'NURSE',
          });
          break;
      }
    }

    // General interventions based on overall risk level
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      interventions.push({
        priority: riskLevel === 'CRITICAL' ? 'URGENT' : 'HIGH',
        category: 'INCREASE_MONITORING',
        clinicalAction: 'Increase visit frequency to daily or every other day',
        rationale: `Overall risk level: ${riskLevel}`,
        expectedOutcome: 'Early detection of clinical deterioration',
        responsibleRole: 'COORDINATOR',
      });

      interventions.push({
        priority: 'MEDIUM',
        category: 'FAMILY_EDUCATION',
        clinicalAction: 'Educate family on warning signs and when to call 911',
        rationale: 'High hospitalization risk requires family awareness',
        expectedOutcome: 'Faster response to emergencies, family preparedness',
        responsibleRole: 'NURSE',
      });
    }

    return interventions;
  }

  /**
   * Helper: Calculate average of array
   */
  private average(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}
