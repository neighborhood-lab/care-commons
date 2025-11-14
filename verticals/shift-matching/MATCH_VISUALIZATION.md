# Match Visualization Feature

## Overview

The Match Visualization feature provides detailed, data-driven explanations for why specific caregivers are matched to shifts. It helps coordinators make informed assignment decisions by showing concrete examples of how caregivers meet (or don't meet) shift requirements.

## Features

### Enhanced Match Explanations

The system now generates detailed explanations showing:

- **Skills Match**: "Client needs Alzheimer's care → Sarah has Dementia Care certification (5 years experience)"
- **Proximity**: "Client in Austin, TX → Sarah lives 12.3 miles away (approx. 25-minute drive)"
- **Availability**: "Visit Tuesday 10:00-12:00 → Sarah available Tuesday (no conflicts)"
- **Preferences**: "Client prefers Spanish-speaking → Sarah speaks English, Spanish"
- **Track Record**: "Sarah has 98% on-time rate, 4.8/5 average rating"
- **Experience**: "Sarah has completed 5 previous visits with this client"

### Visual Components

Two new React components are available:

1. **MatchExplanationVisualization** - Full-featured visualization with expandable categories
2. **MatchExplanationCompact** - Condensed view for list displays

## Usage

### Backend: Generating Enhanced Explanations

```typescript
import {
  EnhancedMatchExplanations,
  MatchingAlgorithm
} from '@care-commons/shift-matching';

// After evaluating a match candidate
const candidate = MatchingAlgorithm.evaluateMatch(openShift, caregiverContext, config);

// Generate enhanced explanations
const explanations = EnhancedMatchExplanations.generateEnhancedExplanations(
  openShift,
  caregiverContext,
  candidate.scores
);

// Generate a concise summary
const summary = EnhancedMatchExplanations.generateSummary(
  openShift,
  candidate,
  caregiverContext
);

// Return to client
return {
  candidate,
  explanations,
  summary,
};
```

### Frontend: Displaying the Visualization

```tsx
import { MatchExplanationVisualization } from '@care-commons/shift-matching';

function AssignmentScreen() {
  const { candidate, explanations } = useMatchData(shiftId, caregiverId);

  return (
    <div>
      <h2>Assignment Preview</h2>

      <MatchExplanationVisualization
        explanations={explanations}
        overallScore={candidate.overallScore}
        caregiverName={candidate.caregiverName}
      />

      {/* Assignment actions */}
      <button onClick={() => assignCaregiver()}>
        Assign to Shift
      </button>
    </div>
  );
}
```

### Compact View for Lists

```tsx
import { MatchExplanationCompact } from '@care-commons/shift-matching';

function MatchCandidateList({ candidates }) {
  return (
    <div>
      {candidates.map(candidate => (
        <div key={candidate.caregiverId}>
          <h3>{candidate.caregiverName} - {candidate.overallScore}</h3>

          <MatchExplanationCompact
            explanations={candidate.explanations}
          />
        </div>
      ))}
    </div>
  );
}
```

## Explanation Categories

### 1. Skills & Certifications

Shows how the caregiver's skills and certifications align with shift requirements.

**Example Details:**
- Requirement: "Client needs Dementia Care"
- Caregiver: "Sarah has Dementia Care (5 years experience)"
- Match: PERFECT ✓
- Explanation: "Perfect match for required skill"

### 2. Location & Travel

Displays distance, travel time, and fuel cost estimates.

**Example Details:**
- Requirement: "Visit location: Austin, TX"
- Caregiver: "Sarah lives 12.3 miles away"
- Match: GOOD
- Explanation: "Approximately 25-minute drive"
- Additional: "Estimated round-trip fuel cost: $3.69"

### 3. Availability & Schedule

Shows schedule fit and conflicts.

**Example Details:**
- Requirement: "Visit Tuesday 10:00-12:00"
- Caregiver: "Sarah available Tuesday (no conflicts)"
- Match: PERFECT ✓
- Explanation: "Schedule is clear for this time slot"

**With Conflict:**
- Requirement: "Visit Tuesday 10:00-12:00"
- Caregiver: "Sarah has conflict: John Doe 10:30-11:30"
- Match: MISSING ✗
- Explanation: "Schedule conflict prevents assignment"

### 4. Client Preferences

Checks language, gender, and preferred caregiver lists.

**Example Details:**
- Requirement: "Client prefers Spanish-speaking caregiver"
- Caregiver: "Sarah speaks English, Spanish"
- Match: PERFECT ✓
- Explanation: "Excellent communication match"

### 5. Experience & History

Shows previous work with the client and ratings.

**Example Details:**
- Requirement: "Continuity of care"
- Caregiver: "Sarah has completed 5 previous visits with this client"
- Match: PERFECT ✓
- Explanation: "Established relationship and familiarity"
- Additional: "Client rated Sarah 4.8/5 ⭐⭐⭐⭐⭐"

### 6. Track Record & Reliability

Displays on-time rate, rejection history, and compliance status.

**Example Details:**
- Requirement: "Dependable caregiver"
- Caregiver: "Sarah has 98% on-time rate"
- Match: PERFECT ✓
- Explanation: "Exceptional reliability - rarely late or absent"

- Requirement: "Shift acceptance"
- Caregiver: "Sarah has not rejected any recent shift proposals"
- Match: PERFECT ✓
- Explanation: "High likelihood of accepting this assignment"

## Match Quality Indicators

Each detail includes a match quality indicator:

- **PERFECT** (✓): Exact match, ideal candidate
- **GOOD**: Meets requirement with minor variations
- **PARTIAL** (⚠️): Partially meets requirement, needs consideration
- **MISSING** (✗): Does not meet requirement, may block assignment
- **NEUTRAL**: Informational, doesn't affect scoring

## Visual Design

### Category Icons

- 🏆 Skills & Certifications (Award icon)
- 📍 Location & Travel (MapPin icon)
- 📅 Availability & Schedule (Calendar icon)
- 💖 Client Preferences (Heart icon)
- 📈 Experience & History (TrendingUp icon)
- 🛡️ Track Record & Reliability (Shield icon)

### Color Coding

- **Green**: Positive impact, high score (85+)
- **Blue**: Good match, acceptable score (70-84)
- **Yellow**: Fair match with concerns (50-69)
- **Red**: Poor match or blocking issues (<50)

### Overall Recommendation

The visualization includes an automatic recommendation based on the overall score:

- **85-100**: "Highly recommended. This caregiver is an excellent match..."
- **70-84**: "Good candidate. This caregiver meets the key requirements..."
- **50-69**: "Acceptable option. Review details before assignment..."
- **<50**: "Not recommended. Consider alternative candidates..."

## API Integration

### New Endpoint (Placeholder)

```
GET /api/shifts/open/:shiftId/match-explanation?caregiverId=:caregiverId
```

**Response:**
```json
{
  "candidate": {
    "caregiverId": "...",
    "caregiverName": "Sarah Johnson",
    "overallScore": 92,
    "matchQuality": "EXCELLENT",
    "scores": { ... }
  },
  "explanations": [
    {
      "category": "skills",
      "title": "Skills & Certifications Match",
      "score": 100,
      "overallImpact": "POSITIVE",
      "details": [
        {
          "requirement": "Client needs Dementia Care",
          "caregiverAttribute": "Sarah has Dementia Care (5 years experience)",
          "match": "PERFECT",
          "explanation": "Perfect match for required skill",
          "icon": "✓"
        }
      ]
    }
  ],
  "summary": [
    "Has all required skills and certifications",
    "Only 12.3 miles from client",
    "Has worked with this client 5 times before",
    "Exceptional 98% on-time rate"
  ]
}
```

## Implementation Checklist

When integrating this feature into your assignment screens:

- [ ] Import `EnhancedMatchExplanations` utility in backend
- [ ] Generate explanations when evaluating match candidates
- [ ] Store explanations with match results (optional)
- [ ] Import `MatchExplanationVisualization` component in frontend
- [ ] Add visualization to assignment review screens
- [ ] Consider using `MatchExplanationCompact` for list views
- [ ] Test with various match scenarios (perfect, partial, missing skills)
- [ ] Verify accessibility (keyboard navigation, screen readers)
- [ ] Test responsive design on mobile devices

## Examples

### Perfect Match Example

```typescript
// Backend
const perfectMatchExplanation = {
  category: 'skills',
  title: 'Skills & Certifications Match',
  score: 100,
  overallImpact: 'POSITIVE',
  details: [
    {
      requirement: 'Client needs Alzheimer\'s care',
      caregiverAttribute: 'Sarah has Dementia Care certification (expires 2026-03-15)',
      match: 'PERFECT',
      explanation: 'Valid certification',
      icon: '✓',
    },
  ],
};
```

### Proximity Example

```typescript
const proximityExplanation = {
  category: 'proximity',
  title: 'Location & Travel',
  score: 85,
  overallImpact: 'POSITIVE',
  details: [
    {
      requirement: 'Visit location: Austin, TX',
      caregiverAttribute: 'Sarah lives 12.3 miles away',
      match: 'GOOD',
      explanation: 'Approximately 25-minute drive',
      icon: '📍',
    },
    {
      requirement: 'Travel compensation',
      caregiverAttribute: 'Estimated round-trip: 24.6 miles',
      match: 'NEUTRAL',
      explanation: 'Approximate fuel cost: $3.69',
      icon: '⛽',
    },
  ],
};
```

### Missing Skill Example

```typescript
const missingSkillExplanation = {
  category: 'skills',
  title: 'Skills & Certifications Match',
  score: 60,
  overallImpact: 'NEGATIVE',
  details: [
    {
      requirement: 'Requires CPR certification',
      caregiverAttribute: 'Sarah missing CPR',
      match: 'MISSING',
      explanation: 'Missing required certification - cannot assign',
      icon: '✗',
    },
  ],
};
```

## Testing

Run the test suite:

```bash
npm test verticals/shift-matching/src/utils/__tests__/enhanced-match-explanations.test.ts
```

Test scenarios included:
- Perfect match across all categories
- Missing skills and certifications
- Schedule conflicts
- First-time client assignments
- High reliability vs. rejection history
- Language and gender preferences

## Accessibility

The visualization components follow accessibility best practices:

- Semantic HTML structure with proper heading hierarchy
- Color is not the only indicator (icons + text)
- Keyboard navigation support for expandable sections
- ARIA labels for screen readers
- Sufficient color contrast (WCAG AA compliant)

## Future Enhancements

Potential improvements for future releases:

- [ ] Real-time updates when caregiver data changes
- [ ] Historical comparison ("better than 85% of previous matches")
- [ ] Machine learning insights ("clients like this usually prefer...")
- [ ] Interactive filtering ("show only caregivers with perfect skill match")
- [ ] Export to PDF for offline review
- [ ] Integration with calendar applications
- [ ] Push notifications for excellent matches

## Support

For questions or issues:
- Check the main [Shift Matching README](./README.md)
- Review [API documentation](../../docs/api/shift-matching.md)
- Open an issue on GitHub

---

**Care Commons** - Shared care software, community owned
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
