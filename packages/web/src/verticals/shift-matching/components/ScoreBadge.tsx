import React from 'react';
import type { MatchQuality } from '../types';

interface ScoreBadgeProps {
  score: number;
  quality?: MatchQuality;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, quality, size = 'md' }) => {
  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-700 bg-green-100 border-green-300';
    if (score >= 70) return 'text-blue-700 bg-blue-100 border-blue-300';
    if (score >= 50) return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    return 'text-red-700 bg-red-100 border-red-300';
  };

  const getSizeClasses = (): string => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-lg px-4 py-2';
      case 'md':
      default:
        return 'text-sm px-3 py-1.5';
    }
  };

  const colorClasses = getScoreColor(score);
  const sizeClasses = getSizeClasses();

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${sizeClasses} rounded-lg border ${colorClasses} font-semibold`}>
      <span className={size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl'}>
        {score}
      </span>
      {quality && (
        <span className="text-xs uppercase tracking-wide opacity-75">
          {quality}
        </span>
      )}
    </div>
  );
};
