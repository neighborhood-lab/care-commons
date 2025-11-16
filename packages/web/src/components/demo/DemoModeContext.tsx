/**
 * Demo Mode Context
 * 
 * React context for managing demo mode state throughout the application.
 * Provides:
 * - Demo mode activation status
 * - Current persona information
 * - State-specific context (TX, FL)
 * - Methods to reset/switch demo state
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

export interface DemoPersona {
  id: string;
  type: 'CAREGIVER' | 'COORDINATOR' | 'ADMINISTRATOR' | 'FAMILY_MEMBER' | 'NURSE';
  name: string;
  role: string;
  email?: string;
}

export interface DemoModeState {
  /** Whether demo mode is currently active */
  isActive: boolean;
  
  /** Current demo persona */
  currentPersona: DemoPersona | null;
  
  /** Available personas for switching */
  availablePersonas: DemoPersona[];
  
  /** State code for demo context (TX, FL, etc.) */
  stateCode: string | null;
  
  /** Organization name for demo */
  organizationName: string;
  
  /** Demo session ID */
  sessionId: string | null;
}

export interface DemoModeContextValue {
  /** Current demo mode state */
  state: DemoModeState;
  
  /** Activate demo mode with optional persona */
  activateDemo: (persona?: DemoPersona, stateCode?: string) => void;
  
  /** Deactivate demo mode */
  deactivateDemo: () => void;
  
  /** Switch to a different persona */
  switchPersona: (persona: DemoPersona) => void;
  
  /** Reset demo data to initial state */
  resetDemo: () => void;
  
  /** Check if a specific feature is available in current demo mode */
  isFeatureAvailable: (feature: string) => boolean;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export interface DemoModeProviderProps {
  children: ReactNode;
  
  /** Initial demo mode state */
  initialState?: Partial<DemoModeState>;
  
  /** Callback when demo mode is activated */
  onActivate?: (persona: DemoPersona | null, stateCode: string | null) => void;
  
  /** Callback when demo mode is deactivated */
  onDeactivate?: () => void;
  
  /** Callback when persona is switched */
  onPersonaSwitch?: (persona: DemoPersona) => void;
  
  /** Callback when demo is reset */
  onReset?: () => void;
}

/**
 * Demo Mode Provider Component
 * 
 * Wraps the application to provide demo mode state and methods.
 */
export function DemoModeProvider({
  children,
  initialState = {},
  onActivate,
  onDeactivate,
  onPersonaSwitch,
  onReset,
}: DemoModeProviderProps): React.ReactElement {
  const [state, setState] = useState<DemoModeState>({
    isActive: false,
    currentPersona: null,
    availablePersonas: [],
    stateCode: null,
    organizationName: 'Demo Organization',
    sessionId: null,
    ...initialState,
  });

  const activateDemo = useCallback(
    (persona?: DemoPersona, stateCode?: string) => {
      const newState: DemoModeState = {
        ...state,
        isActive: true,
        currentPersona: persona || state.currentPersona,
        stateCode: stateCode || state.stateCode,
        sessionId: `demo-${Date.now()}`,
      };
      
      setState(newState);
      onActivate?.(persona || null, stateCode || null);
    },
    [state, onActivate]
  );

  const deactivateDemo = useCallback(() => {
    setState({
      ...state,
      isActive: false,
      sessionId: null,
    });
    onDeactivate?.();
  }, [state, onDeactivate]);

  const switchPersona = useCallback(
    (persona: DemoPersona) => {
      setState({
        ...state,
        currentPersona: persona,
      });
      onPersonaSwitch?.(persona);
    },
    [state, onPersonaSwitch]
  );

  const resetDemo = useCallback(() => {
    const newSessionId = `demo-${Date.now()}`;
    setState({
      ...state,
      sessionId: newSessionId,
    });
    onReset?.();
  }, [state, onReset]);

  const isFeatureAvailable = useCallback(
    (_feature: string): boolean => {
      if (!state.isActive) {
        return true; // All features available in non-demo mode
      }

      // Demo mode feature restrictions can be added here
      // For now, all features are available in demo mode
      return true;
    },
    [state.isActive]
  );

  const contextValue: DemoModeContextValue = useMemo(
    () => ({
      state,
      activateDemo,
      deactivateDemo,
      switchPersona,
      resetDemo,
      isFeatureAvailable,
    }),
    [state, activateDemo, deactivateDemo, switchPersona, resetDemo, isFeatureAvailable]
  );

  return (
    <DemoModeContext.Provider value={contextValue}>
      {children}
    </DemoModeContext.Provider>
  );
}

/**
 * Hook to access demo mode context
 * 
 * @throws Error if used outside of DemoModeProvider
 */
export function useDemoMode(): DemoModeContextValue {
  const context = useContext(DemoModeContext);
  
  if (context === null) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  
  return context;
}

/**
 * Hook to check if demo mode is active
 */
export function useIsDemoMode(): boolean {
  const { state } = useDemoMode();
  return state.isActive;
}

/**
 * Hook to get current demo persona
 */
export function useDemoPersona(): DemoPersona | null {
  const { state } = useDemoMode();
  return state.currentPersona;
}

/**
 * Hook to get demo state code
 */
export function useDemoStateCode(): string | null {
  const { state } = useDemoMode();
  return state.stateCode;
}
