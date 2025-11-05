/**
 * Scenario Button Component
 *
 * Floating action button to access scenario library
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScenario } from '../../scenarios';

export const ScenarioButton: React.FC = () => {
  const navigate = useNavigate();
  const { isActive } = useScenario();

  // Don't show button if scenario is active
  if (isActive) return null;

  const handleClick = () => {
    navigate('/scenarios');
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-16 h-16 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-shadow flex items-center justify-center"
        title="Browse Scenarios"
      >
        <Film className="h-7 w-7" />
      </motion.button>

      {/* Badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute -top-2 -right-2 w-8 h-8 bg-white border-2 border-pink-600 text-pink-600 rounded-full shadow-lg flex items-center justify-center text-xs font-bold"
        title="Available scenarios"
      >
        2
      </motion.div>
    </div>
  );
};
