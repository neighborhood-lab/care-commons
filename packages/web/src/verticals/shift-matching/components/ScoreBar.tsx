import React from 'react';

interface ScoreBarProps {
  label: string;
  score: number;
  showValue?: boolean;
}

export const ScoreBar: React.FC<ScoreBarProps> = ({ label, score, showValue = true }) => {
  const getBarColor = (score: number): string => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const barColor = getBarColor(score);
  const percentage = Math.min(100, Math.max(0, score));

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-600 font-medium">{label}</span>
        {showValue && <span className="text-gray-900 font-semibold">{score}</span>}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300 rounded-full`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${score}%`}
        />
      </div>
    </div>
  );
};
