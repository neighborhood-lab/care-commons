/**
 * Narration Box Component
 *
 * Displays narrative text for scenario steps
 */

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

interface NarrationBoxProps {
  text: string;
  speaker?: string;
  time?: string;
  role?: string;
}

export const NarrationBox: React.FC<NarrationBoxProps> = ({
  text,
  speaker,
  time,
  role,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-gradient-to-r from-purple-900 to-blue-900 rounded-xl p-6 text-white shadow-xl"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>
        <div className="flex-1">
          {(time || role) && (
            <div className="flex items-center gap-3 text-sm text-purple-200 mb-2">
              {time && <span>🕐 {time}</span>}
              {role && <span>👤 {role}</span>}
            </div>
          )}
          {speaker && (
            <div className="text-sm font-semibold text-purple-200 mb-2">
              {speaker}
            </div>
          )}
          <p className="text-lg leading-relaxed">{text}</p>
        </div>
      </div>
    </motion.div>
  );
};
