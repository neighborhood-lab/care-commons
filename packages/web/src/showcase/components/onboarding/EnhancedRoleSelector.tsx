/**
 * Enhanced Role Selector Modal
 *
 * Full-screen role selection experience with detailed persona information
 */

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { personas } from '../../data/personas';

interface EnhancedRoleSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (roleId: string) => void;
  currentRole?: string;
}

export const EnhancedRoleSelector: React.FC<EnhancedRoleSelectorProps> = ({
  isOpen,
  onClose,
  onSelectRole,
  currentRole,
}) => {
  const handleSelectRole = (roleId: string) => {
    onSelectRole(roleId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black bg-opacity-50"
        />

        {/* Modal Content */}
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gray-900 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Choose Role</h2>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-300 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Persona Grid */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personas.map((persona) => (
                  <PersonaDetailCard
                    key={persona.id}
                    persona={persona}
                    isCurrent={currentRole === persona.id}
                    onConfirm={() => handleSelectRole(persona.id)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

interface PersonaDetailCardProps {
  persona: any;
  isCurrent: boolean;
  onConfirm: () => void;
}

const PersonaDetailCard: React.FC<PersonaDetailCardProps> = ({
  persona,
  isCurrent,
  onConfirm,
}) => {
  return (
    <button
      onClick={onConfirm}
      disabled={isCurrent}
      className={`relative text-left p-6 rounded-lg border-2 transition-all ${
        isCurrent
          ? 'border-gray-900 bg-gray-50 opacity-50 cursor-not-allowed'
          : 'border-gray-200 hover:border-gray-900'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">
            {persona.id === 'admin' && '👨‍💼'}
            {persona.id === 'coordinator' && '👩‍⚕️'}
            {persona.id === 'caregiver' && '👩‍🔬'}
            {persona.id === 'patient' && '👵'}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{persona.name}</h3>
          <p className="text-sm text-gray-600">{persona.title}</p>
        </div>
      </div>
      {isCurrent && (
        <div className="mt-3 text-xs text-gray-600">
          Current
        </div>
      )}
    </button>
  );
};
