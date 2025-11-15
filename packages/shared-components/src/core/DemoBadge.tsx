import React from 'react';
import { Badge } from './Badge.js';
import { Tooltip } from './Tooltip.js';
import { cn } from '../utils/classnames.js';

export interface DemoBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
  showTooltip?: boolean;
}

/**
 * DemoBadge - Indicates demo/sample data with optional tooltip
 *
 * Used to help users understand they're viewing sample data that can be
 * safely modified or experimented with.
 */
export const DemoBadge: React.FC<DemoBadgeProps> = ({
  className,
  size = 'sm',
  showTooltip = true,
}) => {
  const badge = (
    <Badge
      variant="info"
      size={size}
      className={cn('cursor-default', className)}
    >
      Demo Data
    </Badge>
  );

  if (showTooltip) {
    return (
      <Tooltip
        content="This is sample data. Feel free to make changes!"
        position="top"
      >
        {badge}
      </Tooltip>
    );
  }

  return badge;
};
