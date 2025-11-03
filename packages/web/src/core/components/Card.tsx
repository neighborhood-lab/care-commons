import React from 'react';
import { cn } from '../utils/classnames';
import type { BaseComponentProps } from '../types/ui';

export interface CardProps extends BaseComponentProps {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  hover = false,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200',
        paddingClasses[padding],
        hover && 'transition-shadow hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps extends BaseComponentProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action, className }) => {
  return (
    <div className={cn('flex items-start justify-between', className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardContent: React.FC<BaseComponentProps> = ({ children, className }) => {
  return <div className={cn('mt-4', className)}>{children}</div>;
};

export const CardFooter: React.FC<BaseComponentProps> = ({ children, className }) => {
  return <div className={cn('mt-6 pt-4 border-t border-gray-200', className)}>{children}</div>;
};
