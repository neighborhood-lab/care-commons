import { OpenShift, MatchCandidate, MatchingConfiguration, ConflictingVisit } from '../types/shift-matching';
import { Caregiver } from '@care-commons/caregiver-staff';
export interface CaregiverContext {
    caregiver: Caregiver;
    currentWeekHours: number;
    conflictingVisits: ConflictingVisit[];
    previousVisitsWithClient: number;
    clientRating?: number;
    reliabilityScore: number;
    recentRejectionCount: number;
    distanceFromShift?: number;
}
export declare class MatchingAlgorithm {
    static evaluateMatch(shift: OpenShift, caregiverContext: CaregiverContext, config: MatchingConfiguration): MatchCandidate;
    private static calculateScores;
    private static scoreSkillMatch;
    private static scoreAvailability;
    private static scoreProximity;
    private static scorePreferences;
    private static scoreExperience;
    private static scoreReliability;
    private static scoreCompliance;
    private static scoreCapacity;
    private static calculateOverallScore;
    private static checkEligibility;
    private static determineMatchQuality;
    private static generateMatchReasons;
    static rankCandidates(candidates: MatchCandidate[]): MatchCandidate[];
}
//# sourceMappingURL=matching-algorithm.d.ts.map