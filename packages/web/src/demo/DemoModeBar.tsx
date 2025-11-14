/**
 * Demo Mode Bar Component
 *
 * Persistent banner that displays demo mode status and controls
 */

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDemoSession } from './useDemoSession.js';
import type { DemoPersonaType } from './types.js';

const PERSONA_LABELS: Record<DemoPersonaType, string> = {
  CAREGIVER: 'Caregiver',
  COORDINATOR_FIELD: 'Field Coordinator',
  COORDINATOR_SCHEDULING: 'Scheduling Coordinator',
  COORDINATOR_CARE: 'Care Coordinator',
  ADMINISTRATOR: 'Administrator',
  FAMILY_MEMBER: 'Family Member',
};

export function DemoModeBar() {
  const { session, isActive, switchPersona, resetSession, endSession } = useDemoSession();
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const location = useLocation();

  // Check if we're on the login page (no sidebar)
  const isLoginPage = location.pathname === '/login';

  // Apply left padding on desktop for pages with sidebar
  const containerClass = isLoginPage ? '' : 'lg:pl-64';

  if (!isActive || !session) {
    return (
      <div className="bg-blue-600 text-white shadow-md">
        <div className={`px-4 py-2 ${containerClass}`}>
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm">DEMO MODE</span>
            <span className="text-xs opacity-90">Try the platform with sample data • No real PHI</span>
          </div>
        </div>
      </div>
    );
  }

  const expiresAt = new Date(session.expiresAt);
  const now = new Date();
  const timeRemaining = Math.max(0, expiresAt.getTime() - now.getTime());
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
      <div className={`px-4 py-2.5 ${containerClass}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Left section: Demo badge + Persona info */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="font-bold text-sm">DEMO MODE</span>
            </div>

            {/* Current persona */}
            <div className="flex items-center gap-2 text-sm">
              <span className="opacity-90">Logged in as</span>
              <span className="font-semibold">{session.currentPersona.name}</span>
              <span className="opacity-75">({PERSONA_LABELS[session.currentPersona.type]})</span>
            </div>

            {/* Organization info with stats */}
            <div className="text-sm opacity-90 hidden md:block">
              <span>Viewing {session.organizationName}</span>
              {session.stats && (
                <span className="ml-1">
                  • {session.stats.clientCount} clients, {session.stats.caregiverCount} caregivers
                </span>
              )}
            </div>
          </div>

          {/* Right section: Controls */}
          <div className="flex items-center gap-2">
            {/* Persona switcher dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
                className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1"
              >
                <span>Try another role</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isPersonaMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isPersonaMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg overflow-hidden z-50">
                  <div className="py-1">
                    {session.availablePersonas.map((persona) => (
                      <button
                        key={persona.id}
                        onClick={() => {
                          void switchPersona(persona.type);
                          setIsPersonaMenuOpen(false);
                        }}
                        disabled={persona.id === session.currentPersona.id}
                        className={`
                          w-full px-4 py-2 text-left transition-colors
                          ${
                            persona.id === session.currentPersona.id
                              ? 'bg-blue-50 text-blue-700 cursor-default'
                              : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <div className="font-medium text-sm">{persona.name}</div>
                        <div className="text-xs text-gray-500">
                          {persona.role}
                          {persona.id === session.currentPersona.id && (
                            <span className="ml-2 text-blue-600">✓ Active</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reset button */}
            <button
              onClick={() => void resetSession()}
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-sm font-medium transition-colors hidden sm:block"
              title="Reset all demo changes"
            >
              Reset data
            </button>

            {/* Session timer */}
            <div className="text-xs opacity-75 hidden lg:block">
              {hoursRemaining}h {minutesRemaining}m left
            </div>

            {/* Exit demo button */}
            <button
              onClick={() => void endSession()}
              className="bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              Exit Demo
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isPersonaMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsPersonaMenuOpen(false)}
        />
      )}
    </div>
  );
}
