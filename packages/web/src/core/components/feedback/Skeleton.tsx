import React from 'react';
import { cn } from '../../utils/classnames';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div
      className={cn(
        'bg-gray-200',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      aria-busy="true"
      aria-live="polite"
    />
  );
};

export interface SkeletonCardProps {
  className?: string;
  hasHeader?: boolean;
  hasFooter?: boolean;
  rows?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className,
  hasHeader = true,
  hasFooter = false,
  rows = 3,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200 p-6',
        className
      )}
    >
      {hasHeader && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Skeleton width="60%" height="1.5rem" className="mb-2" />
            <Skeleton width="40%" height="1rem" />
          </div>
          <Skeleton variant="circular" width="2rem" height="2rem" />
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={index}
            height="1rem"
            width={index === rows - 1 ? '70%' : '100%'}
          />
        ))}
      </div>

      {hasFooter && (
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200">
          <Skeleton width="6rem" height="2.5rem" variant="rectangular" />
          <Skeleton width="6rem" height="2.5rem" variant="rectangular" />
        </div>
      )}
    </div>
  );
};

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} height="1rem" width="80%" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4 py-3 border-t border-gray-100"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              height="1rem"
              width={colIndex === 0 ? '90%' : '70%'}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export interface SkeletonListProps {
  items?: number;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 5,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton variant="circular" width="3rem" height="3rem" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height="1rem" />
            <Skeleton width="40%" height="0.875rem" />
          </div>
          <Skeleton width="5rem" height="2rem" variant="rectangular" />
        </div>
      ))}
    </div>
  );
};

Skeleton.displayName = 'Skeleton';
SkeletonCard.displayName = 'SkeletonCard';
SkeletonTable.displayName = 'SkeletonTable';
SkeletonList.displayName = 'SkeletonList';
