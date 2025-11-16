/**
 * Demo Mode Banner Component
 * 
 * Displays a clear visual indicator when the application is running in demo mode.
 * Provides:
 * - Prominent banner with demo mode status
 * - Current persona information
 * - State-specific context (Texas/Florida)
 * - Quick reset functionality
 * - Visual isolation from production data
 */

import React from 'react';

export interface DemoModeBannerProps {
  /** Whether demo mode is active */
  isActive: boolean;
  
  /** Current demo persona */
  persona?: {
    type: string;
    name: string;
    role: string;
  };
  
  /** State context (TX, FL, etc.) */
  stateCode?: string;
  
  /** Organization name for demo */
  organizationName?: string;
  
  /** Callback for resetting demo state */
  onReset?: () => void;
  
  /** Callback for switching personas */
  onSwitchPersona?: () => void;
  
  /** Optional className for styling */
  className?: string;
}

/**
 * Demo Mode Banner Component
 * 
 * Shows a clear visual indicator that the user is in demo mode with options
 * to reset or switch personas.
 */
export function DemoModeBanner({
  isActive,
  persona,
  stateCode,
  organizationName = 'Demo Organization',
  onReset,
  onSwitchPersona,
  className = '',
}: DemoModeBannerProps): React.ReactElement | null {
  if (!isActive) {
    return null;
  }

  const stateDisplay = stateCode ? `${stateCode.toUpperCase()} ` : '';
  const personaDisplay = persona ? `${persona.name} (${persona.role})` : 'Guest';

  return (
    <div
      className={`demo-mode-banner ${className}`}
      role="banner"
      aria-label="Demo Mode Active"
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#FFA500',
        color: '#000',
        padding: '0.75rem 1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '0.875rem',
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        borderBottom: '2px solid #FF8C00',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Left section: Demo mode indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              backgroundColor: '#000',
              color: '#FFA500',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {stateDisplay}DEMO MODE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ opacity: 0.8 }}>Viewing as:</span>
            <strong>{personaDisplay}</strong>
          </div>
          {organizationName && (
            <>
              <span style={{ opacity: 0.6 }}>•</span>
              <span style={{ opacity: 0.8 }}>{organizationName}</span>
            </>
          )}
        </div>

        {/* Right section: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onSwitchPersona && (
            <button
              onClick={onSwitchPersona}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#000',
                border: '1px solid rgba(0, 0, 0, 0.3)',
                padding: '0.375rem 0.75rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              type="button"
            >
              Switch Persona
            </button>
          )}
          {onReset && (
            <button
              onClick={onReset}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#000',
                border: '1px solid rgba(0, 0, 0, 0.3)',
                padding: '0.375rem 0.75rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              type="button"
            >
              Reset Demo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Demo Mode Watermark Component
 * 
 * Adds a subtle watermark overlay to indicate demo mode throughout the application.
 * This ensures users never mistake demo data for production data.
 */
export interface DemoModeWatermarkProps {
  /** Text to display in watermark */
  text?: string;
  
  /** Opacity of watermark (0-1) */
  opacity?: number;
  
  /** Whether to show the watermark */
  show?: boolean;
}

export function DemoModeWatermark({
  text = 'DEMO',
  opacity = 0.05,
  show = true,
}: DemoModeWatermarkProps): React.ReactElement | null {
  if (!show) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
      }}
      aria-hidden="true"
    >
      <div
        style={{
          fontSize: '20vw',
          fontWeight: 900,
          color: '#000',
          transform: 'rotate(-45deg)',
          userSelect: 'none',
          letterSpacing: '0.1em',
        }}
      >
        {text}
      </div>
    </div>
  );
}

/**
 * Demo Mode Context Badge
 * 
 * Small badge to indicate demo context within specific components
 */
export interface DemoModeContextBadgeProps {
  /** State code to display */
  stateCode?: string;
  
  /** Additional context text */
  context?: string;
  
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  
  /** Position */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function DemoModeContextBadge({
  stateCode,
  context,
  size = 'small',
  position = 'top-right',
}: DemoModeContextBadgeProps): React.ReactElement {
  const sizeStyles = {
    small: { fontSize: '0.625rem', padding: '0.125rem 0.375rem' },
    medium: { fontSize: '0.75rem', padding: '0.25rem 0.5rem' },
    large: { fontSize: '0.875rem', padding: '0.375rem 0.75rem' },
  };

  const positionStyles = {
    'top-right': { top: '0.5rem', right: '0.5rem' },
    'top-left': { top: '0.5rem', left: '0.5rem' },
    'bottom-right': { bottom: '0.5rem', right: '0.5rem' },
    'bottom-left': { bottom: '0.5rem', left: '0.5rem' },
  };

  const displayText = stateCode
    ? `${stateCode.toUpperCase()} DEMO${context ? ` - ${context}` : ''}`
    : `DEMO${context ? ` - ${context}` : ''}`;

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[position],
        backgroundColor: '#FFA500',
        color: '#000',
        ...sizeStyles[size],
        borderRadius: '3px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        zIndex: 10,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
      }}
    >
      {displayText}
    </div>
  );
}
