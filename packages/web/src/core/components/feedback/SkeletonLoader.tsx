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
    wave: 'animate-wave',
    none: '',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={cn(
        'bg-gray-200',
        variantClasses[variant],
        animationClasses[animation],
        variant === 'text' && !height && 'h-4',
        className
      )}
      style={style}
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Preset skeleton layouts for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-6 space-y-4', className)} aria-busy="true" role="status">
    <div className="flex items-center space-x-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" />
        <Skeleton width="40%" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton width="100%" />
      <Skeleton width="90%" />
      <Skeleton width="95%" />
    </div>
    <span className="sr-only">Loading card content...</span>
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({
  items = 3,
  className,
}) => (
  <div className={cn('space-y-4', className)} aria-busy="true" role="status">
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" />
          <Skeleton width="50%" />
        </div>
      </div>
    ))}
    <span className="sr-only">Loading list items...</span>
  </div>
);

export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => (
  <div className={cn('space-y-2', className)} aria-busy="true" role="status">
    {/* Header */}
    <div className="flex gap-4 pb-2 border-b border-gray-200">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={`header-${index}`} width="100%" height={20} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex gap-4 py-2">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} width="100%" height={16} />
        ))}
      </div>
    ))}
    <span className="sr-only">Loading table data...</span>
  </div>
);

export const SkeletonForm: React.FC<{ fields?: number; className?: string }> = ({
  fields = 4,
  className,
}) => (
  <div className={cn('space-y-6', className)} aria-busy="true" role="status">
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} className="space-y-2">
        <Skeleton width="30%" height={16} />
        <Skeleton width="100%" height={40} variant="rectangular" />
      </div>
    ))}
    <div className="flex gap-3 pt-4">
      <Skeleton width={100} height={40} variant="rectangular" />
      <Skeleton width={100} height={40} variant="rectangular" />
    </div>
    <span className="sr-only">Loading form...</span>
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
  };

  return (
    <Skeleton
      variant="circular"
      width={sizeMap[size]}
      height={sizeMap[size]}
      className={className}
    />
  );
};
