/**
 * HR & Onboarding Tests
 *
 * Basic tests for the onboarding vertical
 */

import { describe, it, expect } from 'vitest';
import { OnboardingStage, DocumentType, BackgroundCheckType } from '../types/onboarding';

describe('HR & Onboarding Types', () => {
  it('should have OnboardingStage enum', () => {
    expect(OnboardingStage.NOT_STARTED).toBe('not_started');
    expect(OnboardingStage.ONBOARDING_COMPLETE).toBe('onboarding_complete');
  });

  it('should have DocumentType enum', () => {
    expect(DocumentType.GOVERNMENT_ID).toBe('government_id');
    expect(DocumentType.NURSING_LICENSE).toBe('nursing_license');
  });

  it('should have BackgroundCheckType enum', () => {
    expect(BackgroundCheckType.CRIMINAL).toBe('criminal');
    expect(BackgroundCheckType.EMPLOYMENT).toBe('employment');
  });
});
