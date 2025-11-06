/**
 * Demo Mode Bar Component
 * 
 * Persistent banner that displays demo mode status and controls
 */

import { useState } from 'react';
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
  const { session, isActive, switchPersona, resetSession, endSession, createSession } = useDemoSession();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isActive || !session) {
    return (
      <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm">DEMO MODE</span>
          <span className="text-xs opacity-90">Try the platform with sample data • No real PHI</span>
        </div>
        <button
          onClick={() => void createSession()}
          className="bg-white text-blue-600 px-4 py-1 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          Start Demo Session
        </button>
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
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="font-bold text-sm">DEMO MODE</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-90">Viewing as:</span>
            <span className="font-semibold">{session.currentPersona.name}</span>
            <span className="opacity-75">({PERSONA_LABELS[session.currentPersona.type]})</span>
          </div>

          <div className="text-xs opacity-75">
            Session expires in {hoursRemaining}h {minutesRemaining}m
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            {isExpanded ? 'Hide Controls' : 'Show Controls'}
          </button>
          
          <button
            onClick={() => void endSession()}
            className="bg-red-500/80 hover:bg-red-500 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Exit Demo
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-white/10 px-4 py-3 border-t border-white/20">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Switch Persona</h4>
              {session.availablePersonas.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {session.availablePersonas.map((persona) => (
                    <button
                      key={persona.id}
                      onClick={() => void switchPersona(persona.type)}
                      disabled={persona.id === session.currentPersona.id}
                      className={`
                        px-3 py-2 rounded text-sm font-medium transition-colors text-left
                        ${persona.id === session.currentPersona.id
                          ? 'bg-white/30 cursor-not-allowed'
                          : 'bg-white/20 hover:bg-white/30 cursor-pointer'
                        }
                      `}
                    >
                      <div className="font-semibold">{persona.name}</div>
                      <div className="text-xs opacity-75">{persona.role}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white/10 px-3 py-2 rounded text-xs opacity-75">
                  No additional personas available
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Session Controls</h4>
              <div className="space-y-2">
                <button
                  onClick={() => void resetSession()}
                  className="w-full bg-white/20 hover:bg-white/30 px-3 py-2 rounded text-sm font-medium transition-colors text-left"
                >
                  <div className="font-semibold">Reset Data</div>
                  <div className="text-xs opacity-75">Restore to initial state</div>
                </button>
                
                <div className="bg-white/10 px-3 py-2 rounded text-xs">
                  <div className="font-semibold mb-1">Session Info</div>
                  <div className="opacity-75 space-y-1">
                    <div>Session ID: {session.id.slice(0, 8)}...</div>
                    <div>Events: {session.state.eventCount}</div>
                    <div>Time: {new Date(session.state.currentTime).toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
