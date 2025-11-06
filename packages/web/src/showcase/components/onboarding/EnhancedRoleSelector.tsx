/**
 * Enhanced Role Selector Modal
 *
 * Full-screen role selection experience with detailed persona information
 */

import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
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
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

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
            className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-blue-600 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">Choose Perspective</h2>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Persona Grid */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personas.map((persona) => (
                  <PersonaDetailCard
                    key={persona.id}
                    persona={persona}
                    isSelected={selectedPersona === persona.id}
                    isCurrent={currentRole === persona.id}
                    onSelect={() => setSelectedPersona(persona.id)}
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
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
  onConfirm: () => void;
}

const PersonaDetailCard: React.FC<PersonaDetailCardProps> = ({
  persona,
  isSelected,
  isCurrent,
  onSelect,
  onConfirm,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`relative bg-white rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-600 shadow-md'
          : isCurrent
          ? 'border-blue-300 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="p-6">
        {/* Avatar and Basic Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">
              {persona.id === 'admin' && '👨‍💼'}
              {persona.id === 'coordinator' && '👩‍⚕️'}
              {persona.id === 'caregiver' && '👩‍🔬'}
              {persona.id === 'patient' && '👵'}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{persona.name}</h3>
            <p className="text-sm text-gray-500">{persona.title}</p>
          </div>
        </div>

        {/* Action Button */}
        {isSelected && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onConfirm();
            }}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            Select
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};
