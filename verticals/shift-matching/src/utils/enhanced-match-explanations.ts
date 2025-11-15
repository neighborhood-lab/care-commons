/**
 * Enhanced Match Explanations
 *
 * Generates detailed, data-driven explanations for why a caregiver
 * is matched to a specific shift. Goes beyond generic reasons to provide
 * specific, actionable insights for coordinators.
 *
 * Example outputs:
 * - "Client needs Alzheimer's care → Sarah has Dementia Care certification (expires 2026-03-15)"
 * - "Client in Austin, TX → Sarah lives 12.3 miles away (approx. 15-minute drive)"
 * - "Visit Tuesday 10:00-12:00 → Sarah available Tuesday 8:00-17:00 (no conflicts)"
 * - "Client prefers Spanish-speaking → Sarah speaks English, Spanish"
 * - "Sarah has 98% on-time rate, 4.8/5 average rating"
 */

import type { OpenShift, MatchCandidate, MatchScores } from '../types/shift-matching';
import type { CaregiverContext } from './matching-algorithm';

export interface EnhancedMatchExplanation {
  category: string;
  title: string;
  details: MatchDetail[];
  overallImpact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;
}

export interface MatchDetail {
  requirement: string;
  caregiverAttribute: string;
  match: 'PERFECT' | 'GOOD' | 'PARTIAL' | 'MISSING';
  explanation: string;
  icon?: string;
}

export class EnhancedMatchExplanations {
  /**
   * Generate comprehensive match explanations with specific details
   */
  static generateEnhancedExplanations(
    shift: OpenShift,
    context: CaregiverContext,
    scores: MatchScores
  ): EnhancedMatchExplanation[] {
    const explanations: EnhancedMatchExplanation[] = [];

    // Skills & Certifications
    explanations.push(this.explainSkillsMatch(shift, context, scores.skillMatch));

    // Proximity & Travel
    explanations.push(this.explainProximity(shift, context, scores.proximityMatch));

    // Availability & Schedule
    explanations.push(this.explainAvailability(shift, context, scores.availabilityMatch));

    // Client Preferences
    explanations.push(this.explainPreferences(shift, context, scores.preferenceMatch));

    // Experience & History
    explanations.push(this.explainExperience(shift, context, scores.experienceMatch));

    // Track Record & Reliability
    explanations.push(this.explainReliability(context, scores.reliabilityMatch));

    return explanations.filter(e => e.details.length > 0);
  }

  /**
   * Explain skills and certifications match
   */
  private static explainSkillsMatch(
    shift: OpenShift,
    context: CaregiverContext,
    score: number
  ): EnhancedMatchExplanation {
    const { caregiver } = context;
    const details: MatchDetail[] = [];

    const requiredSkills = shift.requiredSkills || [];
    const requiredCerts = shift.requiredCertifications || [];
    const caregiverSkills = caregiver.skills?.map(s => s.name) || [];
    const caregiverCerts = caregiver.credentials || [];

    // Check required skills
    requiredSkills.forEach(requiredSkill => {
      const hasSkill = caregiverSkills.includes(requiredSkill);

      if (hasSkill) {
        const skillInfo = caregiver.skills?.find(s => s.name === requiredSkill);
        const yearsExp = skillInfo?.yearsExperience;

        details.push({
          requirement: `Client needs ${requiredSkill}`,
          caregiverAttribute: yearsExp
            ? `${caregiver.firstName} has ${requiredSkill} (${yearsExp} years experience)`
            : `${caregiver.firstName} has ${requiredSkill} certification`,
          match: 'PERFECT',
          explanation: `Perfect match for required skill`,
          icon: '✓',
        });
      } else {
        details.push({
          requirement: `Client needs ${requiredSkill}`,
          caregiverAttribute: `${caregiver.firstName} does not have ${requiredSkill}`,
          match: 'MISSING',
          explanation: `Missing required skill - may need training or supervision`,
          icon: '✗',
        });
      }
    });

    // Check required certifications
    requiredCerts.forEach(requiredCert => {
      const cert = caregiverCerts.find(c =>
        String(c.type) === requiredCert && c.status === 'ACTIVE'
      );

      if (cert) {
        const expiresIn = cert.expiresAt
          ? Math.ceil((new Date(cert.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null;

        details.push({
          requirement: `Requires ${requiredCert} certification`,
          caregiverAttribute: expiresIn
            ? `${caregiver.firstName} has ${requiredCert} (expires in ${expiresIn} days)`
            : `${caregiver.firstName} has ${requiredCert}`,
          match: expiresIn && expiresIn < 30 ? 'PARTIAL' : 'PERFECT',
          explanation: expiresIn && expiresIn < 30
            ? `Certification expiring soon - renewal needed`
            : `Valid certification`,
          icon: '✓',
        });
      } else {
        details.push({
          requirement: `Requires ${requiredCert} certification`,
          caregiverAttribute: `${caregiver.firstName} missing ${requiredCert}`,
          match: 'MISSING',
          explanation: `Missing required certification - cannot assign`,
          icon: '✗',
        });
      }
    });

    return {
      category: 'skills',
      title: 'Skills & Certifications Match',
      details,
      overallImpact: score >= 90 ? 'POSITIVE' : score >= 70 ? 'NEUTRAL' : 'NEGATIVE',
      score,
    };
  }

  /**
   * Explain proximity and travel feasibility
   */
  private static explainProximity(
    shift: OpenShift,
    context: CaregiverContext,
    score: number
  ): EnhancedMatchExplanation {
    const { caregiver, distanceFromShift } = context;
    const details: MatchDetail[] = [];

    if (distanceFromShift !== undefined) {
      const travelTime = Math.ceil(distanceFromShift * 2); // Rough estimate: 2 min/mile
      const clientLocation = `${shift.address.city}, ${shift.address.state}`;

      details.push({
        requirement: `Visit location: ${clientLocation}`,
        caregiverAttribute: `${caregiver.firstName} lives ${distanceFromShift.toFixed(1)} miles away`,
        match: distanceFromShift < 10 ? 'PERFECT' : distanceFromShift < 20 ? 'GOOD' : 'PARTIAL',
        explanation: `Approximately ${travelTime}-minute drive`,
        icon: '📍',
      });

      // Gas cost estimate (optional)
      const gasEstimate = (distanceFromShift * 2 * 0.15).toFixed(2); // $0.15/mile round trip
      if (distanceFromShift > 5) {
        details.push({
          requirement: `Travel compensation`,
          caregiverAttribute: `Estimated round-trip: ${(distanceFromShift * 2).toFixed(1)} miles`,
          match: 'NEUTRAL',
          explanation: `Approximate fuel cost: $${gasEstimate}`,
          icon: '⛽',
        });
      }
    }

    return {
      category: 'proximity',
      title: 'Location & Travel',
      details,
      overallImpact: score >= 85 ? 'POSITIVE' : score >= 60 ? 'NEUTRAL' : 'NEGATIVE',
      score,
    };
  }

  /**
   * Explain availability and schedule fit
   */
  private static explainAvailability(
    shift: OpenShift,
    context: CaregiverContext,
    score: number
  ): EnhancedMatchExplanation {
    const { caregiver, conflictingVisits } = context;
    const details: MatchDetail[] = [];

    const shiftDay = shift.scheduledDate.toLocaleDateString('en-US', { weekday: 'long' });
    const shiftTime = `${shift.startTime}-${shift.endTime}`;

    if (conflictingVisits.length === 0) {
      details.push({
        requirement: `Visit ${shiftDay} ${shift.startTime}-${shift.endTime}`,
        caregiverAttribute: `${caregiver.firstName} available ${shiftDay} (no conflicts)`,
        match: 'PERFECT',
        explanation: `Schedule is clear for this time slot`,
        icon: '✓',
      });

      // Check if it's a preferred day
      const caregiverPreferredDays = caregiver.preferredDays || [];
      if (caregiverPreferredDays.includes(shiftDay.toUpperCase())) {
        details.push({
          requirement: `Preferred scheduling`,
          caregiverAttribute: `${shiftDay} is one of ${caregiver.firstName}'s preferred days`,
          match: 'PERFECT',
          explanation: `Higher likelihood of acceptance`,
          icon: '⭐',
        });
      }
    } else {
      conflictingVisits.forEach(conflict => {
        details.push({
          requirement: `Visit ${shiftDay} ${shiftTime}`,
          caregiverAttribute: `${caregiver.firstName} has conflict: ${conflict.clientName} ${conflict.startTime}-${conflict.endTime}`,
          match: 'MISSING',
          explanation: `Schedule conflict prevents assignment`,
          icon: '✗',
        });
      });
    }

    return {
      category: 'availability',
      title: 'Availability & Schedule',
      details,
      overallImpact: score === 100 ? 'POSITIVE' : score === 0 ? 'NEGATIVE' : 'NEUTRAL',
      score,
    };
  }

  /**
   * Explain preference alignment
   */
  private static explainPreferences(
    shift: OpenShift,
    context: CaregiverContext,
    score: number
  ): EnhancedMatchExplanation {
    const { caregiver } = context;
    const details: MatchDetail[] = [];

    // Language preference
    if (shift.languagePreference) {
      const caregiverLanguages = caregiver.languages || [];
      const speaksPreferredLanguage = caregiverLanguages.includes(shift.languagePreference);

      details.push({
        requirement: `Client prefers ${shift.languagePreference}-speaking caregiver`,
        caregiverAttribute: speaksPreferredLanguage
          ? `${caregiver.firstName} speaks ${caregiverLanguages.join(', ')}`
          : `${caregiver.firstName} speaks ${caregiverLanguages.join(', ') || 'English'}`,
        match: speaksPreferredLanguage ? 'PERFECT' : 'MISSING',
        explanation: speaksPreferredLanguage
          ? `Excellent communication match`
          : `Language barrier may impact care quality`,
        icon: speaksPreferredLanguage ? '💬' : '🚫',
      });
    }

    // Gender preference
    if (shift.genderPreference && shift.genderPreference !== 'NO_PREFERENCE') {
      const matchesGender = caregiver.gender === shift.genderPreference;

      details.push({
        requirement: `Client prefers ${shift.genderPreference.toLowerCase()} caregiver`,
        caregiverAttribute: `${caregiver.firstName} is ${caregiver.gender?.toLowerCase()}`,
        match: matchesGender ? 'PERFECT' : 'MISSING',
        explanation: matchesGender
          ? `Matches client preference`
          : `Does not match client gender preference`,
        icon: matchesGender ? '✓' : '⚠️',
      });
    }

    // Preferred caregiver list
    if (shift.preferredCaregivers?.includes(caregiver.id)) {
      details.push({
        requirement: `Client's preferred caregiver list`,
        caregiverAttribute: `${caregiver.firstName} is on client's preferred list`,
        match: 'PERFECT',
        explanation: `Client has specifically requested this caregiver`,
        icon: '⭐',
      });
    }

    // Blocked caregiver list
    if (shift.blockedCaregivers?.includes(caregiver.id)) {
      details.push({
        requirement: `Client restrictions`,
        caregiverAttribute: `${caregiver.firstName} is blocked by client`,
        match: 'MISSING',
        explanation: `Client has requested not to work with this caregiver`,
        icon: '🚫',
      });
    }

    return {
      category: 'preferences',
      title: 'Client Preferences',
      details,
      overallImpact: score >= 80 ? 'POSITIVE' : score >= 50 ? 'NEUTRAL' : 'NEGATIVE',
      score,
    };
  }

  /**
   * Explain experience and history with client
   */
  private static explainExperience(
    shift: OpenShift,
    context: CaregiverContext,
    score: number
  ): EnhancedMatchExplanation {
    const { caregiver, previousVisitsWithClient, clientRating } = context;
    const details: MatchDetail[] = [];

    if (previousVisitsWithClient && previousVisitsWithClient > 0) {
      details.push({
        requirement: `Continuity of care`,
        caregiverAttribute: `${caregiver.firstName} has completed ${previousVisitsWithClient} previous visit${previousVisitsWithClient > 1 ? 's' : ''} with this client`,
        match: 'PERFECT',
        explanation: `Established relationship and familiarity`,
        icon: '🤝',
      });

      if (clientRating !== undefined) {
        const ratingStars = '⭐'.repeat(Math.round(clientRating));
        details.push({
          requirement: `Client satisfaction`,
          caregiverAttribute: `Client rated ${caregiver.firstName} ${clientRating.toFixed(1)}/5 ${ratingStars}`,
          match: clientRating >= 4.5 ? 'PERFECT' : clientRating >= 3.5 ? 'GOOD' : 'PARTIAL',
          explanation: clientRating >= 4.5
            ? `Excellent client satisfaction`
            : clientRating >= 3.5
            ? `Good client satisfaction`
            : `Room for improvement`,
          icon: '📊',
        });
      }
    } else {
      details.push({
        requirement: `New client relationship`,
        caregiverAttribute: `${caregiver.firstName} has not worked with this client before`,
        match: 'NEUTRAL',
        explanation: `First-time assignment - opportunity to build new relationship`,
        icon: '🆕',
      });
    }

    // Service type experience
    const serviceTypeExperience = caregiver.skills?.find(s =>
      s.name.toLowerCase().includes(shift.serviceTypeName.toLowerCase())
    );

    if (serviceTypeExperience?.yearsExperience) {
      details.push({
        requirement: `${shift.serviceTypeName} expertise`,
        caregiverAttribute: `${caregiver.firstName} has ${serviceTypeExperience.yearsExperience} years of ${shift.serviceTypeName} experience`,
        match: 'PERFECT',
        explanation: `Extensive experience in this service type`,
        icon: '📚',
      });
    }

    return {
      category: 'experience',
      title: 'Experience & History',
      details,
      overallImpact: score >= 80 ? 'POSITIVE' : score >= 50 ? 'NEUTRAL' : 'NEGATIVE',
      score,
    };
  }

  /**
   * Explain reliability and track record
   */
  private static explainReliability(
    context: CaregiverContext,
    score: number
  ): EnhancedMatchExplanation {
    const { caregiver, reliabilityScore, recentRejectionCount } = context;
    const details: MatchDetail[] = [];

    // Overall reliability score
    if (reliabilityScore !== undefined) {
      const onTimeRate = reliabilityScore; // Assuming reliability score represents on-time %

      details.push({
        requirement: `Dependable caregiver`,
        caregiverAttribute: `${caregiver.firstName} has ${onTimeRate.toFixed(0)}% on-time rate`,
        match: onTimeRate >= 95 ? 'PERFECT' : onTimeRate >= 85 ? 'GOOD' : 'PARTIAL',
        explanation: onTimeRate >= 95
          ? `Exceptional reliability - rarely late or absent`
          : onTimeRate >= 85
          ? `Good reliability - generally dependable`
          : `Some reliability concerns - monitor closely`,
        icon: onTimeRate >= 95 ? '🏆' : onTimeRate >= 85 ? '✓' : '⚠️',
      });
    }

    // Recent rejections
    if (recentRejectionCount > 0) {
      details.push({
        requirement: `Shift acceptance`,
        caregiverAttribute: `${caregiver.firstName} has rejected ${recentRejectionCount} shift${recentRejectionCount > 1 ? 's' : ''} in the last 30 days`,
        match: recentRejectionCount < 3 ? 'PARTIAL' : 'MISSING',
        explanation: recentRejectionCount < 3
          ? `Moderate rejection rate - may be selective`
          : `High rejection rate - lower likelihood of acceptance`,
        icon: '⚠️',
      });
    } else {
      details.push({
        requirement: `Shift acceptance`,
        caregiverAttribute: `${caregiver.firstName} has not rejected any recent shift proposals`,
        match: 'PERFECT',
        explanation: `High likelihood of accepting this assignment`,
        icon: '✓',
      });
    }

    // Compliance status
    if (caregiver.complianceStatus) {
      const complianceIcons = {
        'COMPLIANT': '✅',
        'EXPIRING_SOON': '⏰',
        'PENDING_VERIFICATION': '⏳',
        'EXPIRED': '❌',
        'NON_COMPLIANT': '❌',
      };

      const complianceMessages = {
        'COMPLIANT': 'All credentials current and valid',
        'EXPIRING_SOON': 'Some credentials expiring soon - renewal needed',
        'PENDING_VERIFICATION': 'Credentials pending verification',
        'EXPIRED': 'Credentials expired - cannot assign',
        'NON_COMPLIANT': 'Not compliant - cannot assign',
      };

      details.push({
        requirement: `Active credentials`,
        caregiverAttribute: `${caregiver.firstName} status: ${caregiver.complianceStatus}`,
        match: caregiver.complianceStatus === 'COMPLIANT' ? 'PERFECT' :
               caregiver.complianceStatus === 'EXPIRING_SOON' ? 'PARTIAL' : 'MISSING',
        explanation: complianceMessages[caregiver.complianceStatus] || 'Status unknown',
        icon: complianceIcons[caregiver.complianceStatus] || '?',
      });
    }

    return {
      category: 'reliability',
      title: 'Track Record & Reliability',
      details,
      overallImpact: score >= 85 ? 'POSITIVE' : score >= 60 ? 'NEUTRAL' : 'NEGATIVE',
      score,
    };
  }

  /**
   * Generate a concise summary for display
   */
  static generateSummary(
    shift: OpenShift,
    candidate: MatchCandidate,
    context: CaregiverContext
  ): string[] {
    const summary: string[] = [];

    // Top reasons
    const reasons = candidate.matchReasons
      .filter(r => r.impact === 'POSITIVE')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);

    reasons.forEach(reason => {
      summary.push(reason.description);
    });

    // Distance if close
    if (context.distanceFromShift !== undefined && context.distanceFromShift < 15) {
      summary.push(`Only ${context.distanceFromShift.toFixed(1)} miles from client`);
    }

    // Previous visits
    if (context.previousVisitsWithClient && context.previousVisitsWithClient > 0) {
      summary.push(`Has worked with this client ${context.previousVisitsWithClient} time${context.previousVisitsWithClient > 1 ? 's' : ''} before`);
    }

    // High reliability
    if (context.reliabilityScore >= 95) {
      summary.push(`Exceptional ${context.reliabilityScore.toFixed(0)}% on-time rate`);
    }

    return summary;
  }
}
