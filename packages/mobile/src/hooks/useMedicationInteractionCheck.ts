/**
 * useMedicationInteractionCheck Hook
 *
 * React hook for checking medication interactions using AI.
 * Provides real-time safety alerts before medication administration.
 */

import { useState, useCallback } from 'react';

export interface MedicationInteractionRequest {
  clientId: string;
  newMedicationName?: string;
  newMedicationDosage?: string;
  newMedicationRoute?: string;
  medicationIds?: string[];
}

export type InteractionSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface DrugInteraction {
  medication1: string;
  medication2: string;
  severity: InteractionSeverity;
  description: string;
  clinicalEffect: string;
  recommendation: string;
  references?: string[];
}

export interface AllergyAlert {
  medication: string;
  allergen: string;
  severity: InteractionSeverity;
  description: string;
  recommendation: string;
}

export interface ConditionAlert {
  medication: string;
  condition: string;
  severity: InteractionSeverity;
  description: string;
  recommendation: string;
}

export interface MedicationInteractionResult {
  clientId: string;
  clientName: string;
  analyzedAt: string;
  currentMedications: Array<{
    id: string;
    name: string;
    dosage: string;
    route: string;
  }>;
  newMedication?: {
    name: string;
    dosage?: string;
    route?: string;
  };
  drugInteractions: DrugInteraction[];
  allergyAlerts: AllergyAlert[];
  conditionAlerts: ConditionAlert[];
  overallRiskLevel: InteractionSeverity;
  safeToAdminister: boolean;
  requiresPhysicianReview: boolean;
  clinicalSummary: string;
}

export interface UseMedicationInteractionCheckResult {
  result: MedicationInteractionResult | null;
  loading: boolean;
  error: string | null;
  checkInteractions: (request: MedicationInteractionRequest) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for checking medication interactions
 */
export function useMedicationInteractionCheck(): UseMedicationInteractionCheckResult {
  const [result, setResult] = useState<MedicationInteractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkInteractions = useCallback(async (request: MedicationInteractionRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // TODO: Replace with actual API endpoint (Expo SecureStore token)
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

      const response = await fetch(`${API_URL}/api/medications/check-interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add auth token from SecureStore
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check medication interactions');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error checking medication interactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    result,
    loading,
    error,
    checkInteractions,
    reset,
  };
}
