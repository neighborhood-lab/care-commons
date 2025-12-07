/**
 * Note Autofill Hook
 *
 * React hook for fetching AI-powered autofill suggestions for visit notes.
 * Provides loading states, error handling, and data caching.
 */

import { useState, useCallback } from 'react';

/**
 * Autofill suggestions returned from API
 */
export interface AutofillSuggestions {
  suggestedActivities: string[];
  suggestedMood?: string;
  commonPhrases: string[];
  noteStarter?: string;
  analyzedNotesCount: number;
  dateRange: {
    from: string;
    to: string;
  };
  generatedAt: string;
}

/**
 * Request parameters for autofill
 */
export interface AutofillRequest {
  visitId: string;
  clientId?: string;
  caregiverId?: string;
}

/**
 * Hook return type
 */
export interface UseNoteAutofillReturn {
  suggestions: AutofillSuggestions | null;
  loading: boolean;
  error: string | null;
  fetchSuggestions: (request: AutofillRequest) => Promise<void>;
  clearSuggestions: () => void;
}

/**
 * Hook for fetching note autofill suggestions
 *
 * @example
 * ```tsx
 * const { suggestions, loading, error, fetchSuggestions } = useNoteAutofill();
 *
 * useEffect(() => {
 *   if (visitId) {
 *     fetchSuggestions({ visitId });
 *   }
 * }, [visitId]);
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * if (suggestions) return <Suggestions data={suggestions} />;
 * ```
 */
export function useNoteAutofill(): UseNoteAutofillReturn {
  const [suggestions, setSuggestions] = useState<AutofillSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async (request: AutofillRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/visit-notes/autofill-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for auth
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch suggestions: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.success && data.data) {
        setSuggestions(data.data);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching autofill suggestions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions(null);
    setError(null);
  }, []);

  return {
    suggestions,
    loading,
    error,
    fetchSuggestions,
    clearSuggestions,
  };
}
