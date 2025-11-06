import React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/core/utils';

export interface AvatarProps {
  name?: string;
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

const iconSizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-primary-600',
    'bg-blue-600',
    'bg-green-600',
    'bg-yellow-600',
    'bg-red-600',
    'bg-purple-600',
    'bg-pink-600',
    'bg-indigo-600',
  ];

  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  alt,
  size = 'md',
  className,
}) => {
  const [imageError, setImageError] = React.useState(false);

  const showInitials = !src || imageError;
  const displayName = alt || name || 'User';
  const initials = name ? getInitials(name) : '';
  const bgColor = name ? getColorFromName(name) : 'bg-gray-600';

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={displayName}
        onError={() => setImageError(true)}
        className={cn(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-semibold',
        'transition-transform hover:scale-105',
        sizeClasses[size],
        bgColor,
        className
      )}
      aria-label={displayName}
    >
      {initials ? (
        initials
      ) : (
        <User className={iconSizeClasses[size]} />
      )}
    </div>
  );
};
