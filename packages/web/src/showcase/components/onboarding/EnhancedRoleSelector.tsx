/**
 * Enhanced Role Selector Modal
 *
 * Full-screen role selection experience with detailed persona information
 */

import React, { useState } from 'react';
import { X, Clock, BarChart3, ArrowRight, Search } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  const filteredPersonas = personas.filter((persona) =>
    persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    persona.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    persona.features.some(f => f.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectRole = (roleId: string) => {
    onSelectRole(roleId);
    onClose();
  };

  const handleSurpriseMe = () => {
    const randomPersona = personas[Math.floor(Math.random() * personas.length)];
    if (randomPersona) {
      handleSelectRole(randomPersona.id);
    }
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
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-white">Choose Your Perspective</h2>
                  <p className="text-purple-100 mt-1">
                    Explore the platform from different user roles
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by role or feature..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white"
                  />
                </div>
                <button
                  onClick={handleSurpriseMe}
                  className="px-6 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  🎲 Surprise Me!
                </button>
              </div>
            </div>

            {/* Persona Grid */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {filteredPersonas.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No personas found matching your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredPersonas.map((persona) => (
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
              )}
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
  const difficultyColors: Record<string, string> = {
    beginner: 'green',
    intermediate: 'yellow',
    advanced: 'red',
  };

  const difficultyColor = difficultyColors[persona.difficulty];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative bg-white rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? `border-${persona.color}-500 shadow-lg`
          : isCurrent
          ? 'border-purple-300 bg-purple-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      {isCurrent && (
        <div className="absolute top-3 right-3 px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
          Current Role
        </div>
      )}

      <div className="p-6">
        {/* Avatar and Basic Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-16 h-16 rounded-full bg-${persona.color}-100 flex items-center justify-center flex-shrink-0`}>
            <span className="text-3xl">
              {persona.id === 'admin' && '👨‍💼'}
              {persona.id === 'coordinator' && '👩‍⚕️'}
              {persona.id === 'caregiver' && '👩‍🔬'}
              {persona.id === 'patient' && '👵'}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{persona.name}</h3>
            <p className="text-sm text-gray-600">{persona.title}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`inline-block px-2 py-1 bg-${persona.color}-100 text-${persona.color}-700 rounded text-xs font-semibold`}>
                {persona.id}
              </div>
              <div className={`inline-block px-2 py-1 bg-${difficultyColor}-100 text-${difficultyColor}-700 rounded text-xs font-semibold`}>
                {persona.difficulty}
              </div>
            </div>
          </div>
        </div>

        {/* Mission */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Today's Mission:</h4>
          <p className="text-sm text-gray-600">{persona.missionTitle}</p>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{persona.estimatedTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span>{persona.features.length} features</span>
          </div>
        </div>

        {/* Features List */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Features:</h4>
          <ul className="space-y-1">
            {persona.features.slice(0, 3).map((feature: string, index: number) => (
              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{feature}</span>
              </li>
            ))}
            {persona.features.length > 3 && (
              <li className="text-sm text-gray-500 italic">
                +{persona.features.length - 3} more features...
              </li>
            )}
          </ul>
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
            className={`w-full py-3 bg-gradient-to-r from-${persona.color}-600 to-${persona.color}-700 text-white rounded-lg font-semibold hover:from-${persona.color}-700 hover:to-${persona.color}-800 transition-all flex items-center justify-center gap-2`}
          >
            Start as {persona.name}
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};
