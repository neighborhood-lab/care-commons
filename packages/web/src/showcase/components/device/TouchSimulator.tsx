/**
 * Touch Interaction Simulator
 *
 * Visual effects for touch interactions (ripples, gestures)
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Touch {
  id: number;
  x: number;
  y: number;
}

interface TouchSimulatorProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export const TouchSimulator: React.FC<TouchSimulatorProps> = ({
  children,
  enabled = true,
}) => {
  const [touches, setTouches] = useState<Touch[]>([]);

  const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!enabled) return;

    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0];
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const touch: Touch = {
      id: Date.now(),
      x: clientX,
      y: clientY,
    };

    setTouches(prev => [...prev, touch]);

    // Remove touch after animation
    setTimeout(() => {
      setTouches(prev => prev.filter(t => t.id !== touch.id));
    }, 1000);
  }, [enabled]);

  return (
    <div
      onMouseDown={handleInteraction}
      onTouchStart={handleInteraction}
      className="relative"
    >
      {children}

      {/* Touch Ripples */}
      <AnimatePresence>
        {touches.map(touch => (
          <motion.div
            key={touch.id}
            className="fixed pointer-events-none z-50"
            style={{
              left: touch.x,
              top: touch.y,
            }}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <div className="w-8 h-8 -ml-4 -mt-4 rounded-full border-4 border-blue-500" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
