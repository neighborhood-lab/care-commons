"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingAlgorithm = void 0;
class MatchingAlgorithm {
    static evaluateMatch(shift, caregiverContext, config) {
        const { caregiver } = caregiverContext;
        const scores = this.calculateScores(shift, caregiverContext, config);
        const eligibilityIssues = this.checkEligibility(shift, caregiverContext, config);
        const isEligible = !eligibilityIssues.some((issue) => issue.severity === 'BLOCKING');
        const overallScore = this.calculateOverallScore(scores, config);
        const matchQuality = this.determineMatchQuality(overallScore, isEligible);
        const matchReasons = this.generateMatchReasons(shift, caregiverContext, scores);
        const warnings = eligibilityIssues
            .filter((issue) => issue.severity === 'WARNING')
            .map((issue) => issue.message);
        return {
            caregiverId: caregiver.id,
            openShiftId: shift.id,
            caregiverName: `${caregiver.firstName} ${caregiver.lastName}`,
            caregiverPhone: caregiver.primaryPhone.number,
            employmentType: caregiver.employmentType,
            overallScore,
            matchQuality,
            scores,
            isEligible,
            eligibilityIssues,
            warnings,
            distanceFromShift: caregiverContext.distanceFromShift,
            estimatedTravelTime: caregiverContext.distanceFromShift
                ? Math.ceil(caregiverContext.distanceFromShift * 2)
                : undefined,
            hasConflict: caregiverContext.conflictingVisits.length > 0,
            conflictingVisits: caregiverContext.conflictingVisits.length > 0
                ? caregiverContext.conflictingVisits
                : undefined,
            availableHours: caregiver.maxHoursPerWeek
                ? caregiver.maxHoursPerWeek - caregiverContext.currentWeekHours
                : 0,
            previousVisitsWithClient: caregiverContext.previousVisitsWithClient,
            clientRating: caregiverContext.clientRating,
            reliabilityScore: caregiverContext.reliabilityScore,
            matchReasons,
            computedAt: new Date(),
        };
    }
    static calculateScores(shift, context, config) {
        return {
            skillMatch: this.scoreSkillMatch(shift, context.caregiver),
            availabilityMatch: this.scoreAvailability(shift, context),
            proximityMatch: this.scoreProximity(shift, context, config),
            preferenceMatch: this.scorePreferences(shift, context),
            experienceMatch: this.scoreExperience(shift, context),
            reliabilityMatch: this.scoreReliability(context, config),
            complianceMatch: this.scoreCompliance(context.caregiver),
            capacityMatch: this.scoreCapacity(shift, context),
        };
    }
    static scoreSkillMatch(shift, caregiver) {
        let score = 100;
        const requiredSkills = shift.requiredSkills || [];
        const requiredCerts = shift.requiredCertifications || [];
        const caregiverSkills = caregiver.skills?.map((s) => s.name) || [];
        const caregiverCerts = caregiver.credentials?.map((c) => String(c.type)) || [];
        const missingSkills = requiredSkills.filter((skill) => !caregiverSkills.includes(skill));
        if (missingSkills.length > 0) {
            score -= missingSkills.length * 30;
        }
        const missingCerts = requiredCerts.filter((cert) => !caregiverCerts.includes(cert));
        if (missingCerts.length > 0) {
            score -= missingCerts.length * 40;
        }
        return Math.max(0, score);
    }
    static scoreAvailability(shift, context) {
        if (context.conflictingVisits.length === 0) {
            return 100;
        }
        return 0;
    }
    static scoreProximity(shift, context, config) {
        if (!context.distanceFromShift) {
            return 50;
        }
        const distance = context.distanceFromShift;
        const maxDistance = config.maxTravelDistance || 50;
        if (distance > maxDistance) {
            return 0;
        }
        const score = 100 - ((distance / maxDistance) * 80);
        return Math.max(20, Math.min(100, score));
    }
    static scorePreferences(shift, context) {
        let score = 50;
        const { caregiver } = context;
        if (shift.preferredCaregivers?.includes(caregiver.id)) {
            score += 30;
        }
        if (shift.blockedCaregivers?.includes(caregiver.id)) {
            return 0;
        }
        if (shift.genderPreference && shift.genderPreference !== 'NO_PREFERENCE') {
            if (caregiver.gender === shift.genderPreference) {
                score += 10;
            }
            else {
                score -= 20;
            }
        }
        if (shift.languagePreference) {
            if (caregiver.languages?.includes(shift.languagePreference)) {
                score += 10;
            }
            else {
                score -= 15;
            }
        }
        return Math.max(0, Math.min(100, score));
    }
    static scoreExperience(shift, context) {
        let score = 50;
        const previousVisits = context.previousVisitsWithClient || 0;
        if (previousVisits > 0) {
            score += Math.min(30, previousVisits * 5);
        }
        if (context.clientRating) {
            score += (context.clientRating - 3) * 10;
        }
        return Math.max(0, Math.min(100, score));
    }
    static scoreReliability(context, config) {
        let score = context.reliabilityScore;
        if (config.penalizeFrequentRejections && context.recentRejectionCount > 0) {
            score -= context.recentRejectionCount * 5;
        }
        if (config.boostReliablePerformers && context.reliabilityScore >= 90) {
            score += 10;
        }
        return Math.max(0, Math.min(100, score));
    }
    static scoreCompliance(caregiver) {
        if (caregiver.complianceStatus === 'COMPLIANT') {
            return 100;
        }
        else if (caregiver.complianceStatus === 'EXPIRING_SOON') {
            return 70;
        }
        else if (caregiver.complianceStatus === 'PENDING_VERIFICATION') {
            return 50;
        }
        else {
            return 0;
        }
    }
    static scoreCapacity(shift, context) {
        const { caregiver } = context;
        if (!caregiver.maxHoursPerWeek) {
            return 100;
        }
        const availableHours = caregiver.maxHoursPerWeek - context.currentWeekHours;
        const shiftHours = shift.duration / 60;
        if (availableHours < shiftHours) {
            return 0;
        }
        const remainingAfterShift = availableHours - shiftHours;
        const utilizationRate = (context.currentWeekHours + shiftHours) / caregiver.maxHoursPerWeek;
        if (utilizationRate >= 0.6 && utilizationRate <= 0.8) {
            return 100;
        }
        else if (utilizationRate < 0.6) {
            return 80;
        }
        else {
            return 60;
        }
    }
    static calculateOverallScore(scores, config) {
        const weights = config.weights;
        const weightedScore = (scores.skillMatch * weights.skillMatch +
            scores.availabilityMatch * weights.availabilityMatch +
            scores.proximityMatch * weights.proximityMatch +
            scores.preferenceMatch * weights.preferenceMatch +
            scores.experienceMatch * weights.experienceMatch +
            scores.reliabilityMatch * weights.reliabilityMatch +
            scores.complianceMatch * weights.complianceMatch +
            scores.capacityMatch * weights.capacityMatch) /
            100;
        return Math.round(weightedScore);
    }
    static checkEligibility(shift, context, config) {
        const issues = [];
        const { caregiver } = context;
        if (shift.blockedCaregivers?.includes(caregiver.id)) {
            issues.push({
                type: 'BLOCKED_BY_CLIENT',
                severity: 'BLOCKING',
                message: 'Caregiver is blocked from this client',
            });
        }
        if (config.requireExactSkillMatch) {
            const requiredSkills = shift.requiredSkills || [];
            const caregiverSkills = caregiver.skills?.map((s) => s.name) || [];
            const missingSkills = requiredSkills.filter((skill) => !caregiverSkills.includes(skill));
            if (missingSkills.length > 0) {
                issues.push({
                    type: 'MISSING_SKILL',
                    severity: 'BLOCKING',
                    message: `Missing required skills: ${missingSkills.join(', ')}`,
                });
            }
        }
        if (config.requireActiveCertifications) {
            const requiredCerts = shift.requiredCertifications || [];
            const caregiverCerts = caregiver.credentials
                ?.filter((c) => c.status === 'ACTIVE')
                .map((c) => String(c.type)) || [];
            const missingCerts = requiredCerts.filter((cert) => !caregiverCerts.includes(cert));
            if (missingCerts.length > 0) {
                issues.push({
                    type: 'MISSING_CERTIFICATION',
                    severity: 'BLOCKING',
                    message: `Missing required certifications: ${missingCerts.join(', ')}`,
                });
            }
        }
        if (context.conflictingVisits.length > 0) {
            issues.push({
                type: 'SCHEDULE_CONFLICT',
                severity: 'BLOCKING',
                message: `Has ${context.conflictingVisits.length} conflicting visit(s)`,
            });
        }
        if (caregiver.complianceStatus === 'EXPIRED' || caregiver.complianceStatus === 'NON_COMPLIANT') {
            issues.push({
                type: 'NOT_COMPLIANT',
                severity: 'BLOCKING',
                message: 'Caregiver is not compliant - credentials expired or missing',
            });
        }
        else if (caregiver.complianceStatus === 'EXPIRING_SOON') {
            issues.push({
                type: 'EXPIRED_CREDENTIAL',
                severity: 'WARNING',
                message: 'Some credentials are expiring soon',
            });
        }
        if (config.maxTravelDistance && context.distanceFromShift) {
            if (context.distanceFromShift > config.maxTravelDistance) {
                issues.push({
                    type: 'DISTANCE_TOO_FAR',
                    severity: 'BLOCKING',
                    message: `Distance (${context.distanceFromShift.toFixed(1)} mi) exceeds max travel distance (${config.maxTravelDistance} mi)`,
                });
            }
        }
        if (caregiver.maxHoursPerWeek) {
            const shiftHours = shift.duration / 60;
            const availableHours = caregiver.maxHoursPerWeek - context.currentWeekHours;
            if (availableHours < shiftHours) {
                issues.push({
                    type: 'OVER_HOUR_LIMIT',
                    severity: 'BLOCKING',
                    message: `Would exceed weekly hour limit (${caregiver.maxHoursPerWeek} hrs)`,
                });
            }
        }
        if (config.respectGenderPreference &&
            shift.genderPreference &&
            shift.genderPreference !== 'NO_PREFERENCE') {
            if (caregiver.gender !== shift.genderPreference) {
                issues.push({
                    type: 'GENDER_MISMATCH',
                    severity: 'WARNING',
                    message: `Client prefers ${shift.genderPreference} caregiver`,
                });
            }
        }
        if (config.respectLanguagePreference && shift.languagePreference) {
            if (!caregiver.languages?.includes(shift.languagePreference)) {
                issues.push({
                    type: 'LANGUAGE_MISMATCH',
                    severity: 'WARNING',
                    message: `Client prefers ${shift.languagePreference}-speaking caregiver`,
                });
            }
        }
        return issues;
    }
    static determineMatchQuality(score, isEligible) {
        if (!isEligible) {
            return 'INELIGIBLE';
        }
        if (score >= 85) {
            return 'EXCELLENT';
        }
        else if (score >= 70) {
            return 'GOOD';
        }
        else if (score >= 50) {
            return 'FAIR';
        }
        else {
            return 'POOR';
        }
    }
    static generateMatchReasons(shift, context, scores) {
        const reasons = [];
        if (scores.skillMatch >= 90) {
            reasons.push({
                category: 'SKILL',
                description: 'Has all required skills and certifications',
                impact: 'POSITIVE',
                weight: 0.2,
            });
        }
        else if (scores.skillMatch < 70) {
            reasons.push({
                category: 'SKILL',
                description: 'Missing some required skills or certifications',
                impact: 'NEGATIVE',
                weight: 0.2,
            });
        }
        if (scores.availabilityMatch === 100) {
            reasons.push({
                category: 'AVAILABILITY',
                description: 'No schedule conflicts',
                impact: 'POSITIVE',
                weight: 0.2,
            });
        }
        else {
            reasons.push({
                category: 'AVAILABILITY',
                description: 'Has schedule conflict at this time',
                impact: 'NEGATIVE',
                weight: 0.2,
            });
        }
        if (scores.proximityMatch >= 90) {
            reasons.push({
                category: 'PROXIMITY',
                description: 'Close to client location',
                impact: 'POSITIVE',
                weight: 0.15,
            });
        }
        else if (scores.proximityMatch < 50) {
            reasons.push({
                category: 'PROXIMITY',
                description: 'Far from client location',
                impact: 'NEGATIVE',
                weight: 0.15,
            });
        }
        if (context.previousVisitsWithClient > 0) {
            reasons.push({
                category: 'EXPERIENCE',
                description: `Has ${context.previousVisitsWithClient} previous visit(s) with this client`,
                impact: 'POSITIVE',
                weight: 0.1,
            });
        }
        if (shift.preferredCaregivers?.includes(context.caregiver.id)) {
            reasons.push({
                category: 'PREFERENCE',
                description: 'Preferred by client',
                impact: 'POSITIVE',
                weight: 0.1,
            });
        }
        if (context.reliabilityScore >= 90) {
            reasons.push({
                category: 'RELIABILITY',
                description: 'Highly reliable performer',
                impact: 'POSITIVE',
                weight: 0.1,
            });
        }
        else if (context.reliabilityScore < 60) {
            reasons.push({
                category: 'RELIABILITY',
                description: 'Below-average reliability score',
                impact: 'NEGATIVE',
                weight: 0.1,
            });
        }
        return reasons;
    }
    static rankCandidates(candidates) {
        return candidates.sort((a, b) => {
            if (a.isEligible !== b.isEligible) {
                return a.isEligible ? -1 : 1;
            }
            return b.overallScore - a.overallScore;
        });
    }
}
exports.MatchingAlgorithm = MatchingAlgorithm;
//# sourceMappingURL=matching-algorithm.js.map